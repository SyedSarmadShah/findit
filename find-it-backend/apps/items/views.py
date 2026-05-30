from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from .matching import create_matches_for_item
from .models import Item, ItemClaim, ItemMatch, ItemReport
from .serializers import ItemClaimSerializer, ItemMatchSerializer, ItemReportSerializer, ItemSerializer
from apps.messaging.services import notify_claim_received, notify_claim_reviewed, notify_item_returned


User = get_user_model()


class ItemViewSet(viewsets.ModelViewSet):
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ["title", "description", "category", "location"]
    filterset_fields = ["item_type", "status", "category", "date"]
    ordering_fields = ["created_at", "updated_at", "date"]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Item.objects.select_related("owner")

    def perform_create(self, serializer):
        item = serializer.save(owner=self.request.user)
        try:
            create_matches_for_item(item)
        except Exception:
            pass

    def perform_update(self, serializer):
        if serializer.instance.owner != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You cannot edit this item.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You cannot delete this item.")
        instance.delete()

    @action(detail=False, methods=["get"], url_path="dashboard-analytics", permission_classes=[permissions.IsAuthenticated])
    def dashboard_analytics(self, request):
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)

        item_aggregate = Item.objects.aggregate(
            total_posts=Count("id"),
            total_lost_items=Count("id", filter=Q(item_type=Item.LOST)),
            total_found_items=Count("id", filter=Q(item_type=Item.FOUND)),
            open_lost_reports=Count("id", filter=Q(item_type=Item.LOST, status=Item.OPEN)),
            open_found_reports=Count("id", filter=Q(item_type=Item.FOUND, status=Item.OPEN)),
            active_reports=Count("id", filter=Q(status__in=[Item.OPEN, Item.MATCHED])),
            resolved_reports=Count("id", filter=Q(status=Item.RESOLVED)),
            lost_items_this_month=Count("id", filter=Q(item_type=Item.LOST, created_at__gte=current_month_start)),
            found_items_this_month=Count("id", filter=Q(item_type=Item.FOUND, created_at__gte=current_month_start)),
            lost_items_previous_month=Count(
                "id",
                filter=Q(item_type=Item.LOST, created_at__gte=previous_month_start, created_at__lt=current_month_start),
            ),
            found_items_previous_month=Count(
                "id",
                filter=Q(item_type=Item.FOUND, created_at__gte=previous_month_start, created_at__lt=current_month_start),
            ),
        )

        claim_aggregate = ItemClaim.objects.aggregate(
            active_claims=Count("id", filter=Q(status__in=[ItemClaim.PENDING, ItemClaim.APPROVED])),
            returned_items=Count("id", filter=Q(status=ItemClaim.COMPLETED)),
            completed_this_month=Count("id", filter=Q(status=ItemClaim.COMPLETED, updated_at__gte=current_month_start)),
            completed_previous_month=Count(
                "id",
                filter=Q(
                    status=ItemClaim.COMPLETED,
                    updated_at__gte=previous_month_start,
                    updated_at__lt=current_month_start,
                ),
            ),
        )

        total_matches = ItemMatch.objects.count()
        total_users = User.objects.count()

        total_lost_items = item_aggregate["total_lost_items"] or 0
        returned_items = claim_aggregate["returned_items"] or 0
        recovery_success_rate = (returned_items / total_lost_items * 100) if total_lost_items else 0

        def trend(current, previous):
            if previous == 0:
                return 100.0 if current > 0 else 0.0
            return ((current - previous) / previous) * 100

        monthly_window_start = (current_month_start - timedelta(days=210)).replace(day=1)
        monthly_rows = (
            Item.objects.filter(created_at__gte=monthly_window_start)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(
                lost=Count("id", filter=Q(item_type=Item.LOST)),
                found=Count("id", filter=Q(item_type=Item.FOUND)),
            )
            .order_by("month")
        )

        completed_monthly_rows = (
            ItemClaim.objects.filter(status=ItemClaim.COMPLETED, updated_at__gte=monthly_window_start)
            .annotate(month=TruncMonth("updated_at"))
            .values("month")
            .annotate(returned=Count("id"))
            .order_by("month")
        )
        completed_by_month = {row["month"]: row["returned"] for row in completed_monthly_rows}

        monthly_recovery_trend = [
            {
                "month": row["month"].strftime("%b %Y"),
                "lost": row["lost"],
                "found": row["found"],
                "returned": completed_by_month.get(row["month"], 0),
            }
            for row in monthly_rows
        ]

        category_distribution = list(
            Item.objects.values("category")
            .annotate(value=Count("id"))
            .order_by("-value")[:8]
        )
        for row in category_distribution:
            row["name"] = row.pop("category") or "Uncategorized"

        payload = {
            "summary": {
                "total_users": total_users,
                "total_posts": item_aggregate["total_posts"] or 0,
                "total_lost_items": total_lost_items,
                "total_found_items": item_aggregate["total_found_items"] or 0,
                "items_successfully_returned": returned_items,
                "active_claims": claim_aggregate["active_claims"] or 0,
                "open_lost_reports": item_aggregate["open_lost_reports"] or 0,
                "open_found_reports": item_aggregate["open_found_reports"] or 0,
                "active_reports": item_aggregate["active_reports"] or 0,
                "resolved_reports": item_aggregate["resolved_reports"] or 0,
                "matches_generated": total_matches,
                "recovery_success_rate": round(recovery_success_rate, 2),
                "success_percentage": round(recovery_success_rate, 2),
                "lost_items_this_month": item_aggregate["lost_items_this_month"] or 0,
                "found_items_this_month": item_aggregate["found_items_this_month"] or 0,
            },
            "trends": {
                "total_lost_items": round(
                    trend(item_aggregate["lost_items_this_month"] or 0, item_aggregate["lost_items_previous_month"] or 0),
                    2,
                ),
                "total_found_items": round(
                    trend(item_aggregate["found_items_this_month"] or 0, item_aggregate["found_items_previous_month"] or 0),
                    2,
                ),
                "items_successfully_returned": round(
                    trend(claim_aggregate["completed_this_month"] or 0, claim_aggregate["completed_previous_month"] or 0),
                    2,
                ),
                "active_claims": 0,
                "open_lost_reports": 0,
                "open_found_reports": 0,
                "recovery_success_rate": round(
                    trend(claim_aggregate["completed_this_month"] or 0, claim_aggregate["completed_previous_month"] or 0),
                    2,
                ),
                "matches_generated": 0,
            },
            "charts": {
                "lost_vs_found_items": [
                    {"name": "Lost", "value": total_lost_items},
                    {"name": "Found", "value": item_aggregate["total_found_items"] or 0},
                ],
                "monthly_recovery_trend": monthly_recovery_trend,
                "category_distribution": category_distribution,
            },
        }
        return Response(payload)


class ItemClaimViewSet(viewsets.ModelViewSet):
    serializer_class = ItemClaimSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            ItemClaim.objects.select_related("item", "item__owner", "claimant", "finder")
            .filter(Q(item__owner=user) | Q(claimant=user))
            .distinct()
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def perform_create(self, serializer):
        item = serializer.validated_data["item"]
        user = self.request.user

        if item.owner == user:
            raise PermissionDenied("You cannot claim your own item.")

        if item.status == Item.RESOLVED:
            raise PermissionDenied("This item is already resolved.")

        if ItemClaim.objects.filter(item=item, claimant=user).exists():
            raise PermissionDenied("You have already submitted a claim for this item.")

        claim = serializer.save(claimant=user, finder=item.owner)
        notify_claim_received(user=item.owner, claim_id=claim.id, item_title=item.title, claimant_email=user.email)

    def perform_update(self, serializer):
        claim = self.get_object()
        user = self.request.user

        can_review = claim.item.owner == user or user.is_staff
        if not can_review:
            raise PermissionDenied("Only the item owner can review claims.")

        serializer.save()

    @action(detail=False, methods=["get"], url_path="history")
    def history(self, request):
        claims = self.get_queryset().filter(claimant=request.user)
        serializer = self.get_serializer(claims, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="review-queue")
    def review_queue(self, request):
        claims = ItemClaim.objects.select_related("item", "item__owner", "claimant", "finder")
        if not request.user.is_staff:
            claims = claims.filter(finder=request.user)
        serializer = self.get_serializer(claims.distinct(), many=True)
        return Response(serializer.data)

    def _review_claim(self, request, new_status):
        claim = self.get_object()
        user = request.user

        if not (user.is_staff or claim.finder_id == user.id):
            raise PermissionDenied("Only the finder can review this claim.")

        if claim.status != ItemClaim.PENDING:
            raise PermissionDenied("Only pending claims can be reviewed.")

        with transaction.atomic():
            verification_notes = request.data.get("verification_notes")
            if isinstance(verification_notes, str) and verification_notes.strip():
                claim.verification_notes = verification_notes.strip()

            claim.status = new_status
            claim.save(update_fields=["status", "verification_notes", "updated_at"])

            if new_status == ItemClaim.APPROVED:
                claim.item.status = Item.RESOLVED
                claim.item.save(update_fields=["status", "updated_at"])
                notify_claim_reviewed(user=claim.claimant, claim_id=claim.id, item_title=claim.item.title, approved=True)
            else:
                notify_claim_reviewed(user=claim.claimant, claim_id=claim.id, item_title=claim.item.title, approved=False)

        return Response(self.get_serializer(claim).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._review_claim(request, ItemClaim.APPROVED)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._review_claim(request, ItemClaim.REJECTED)

    @action(detail=True, methods=["post"], url_path="mark-returned")
    def mark_returned(self, request, pk=None):
        claim = self.get_object()
        user = request.user

        if not (user.is_staff or claim.finder_id == user.id):
            raise PermissionDenied("Only the finder can mark an item as returned.")

        if claim.status != ItemClaim.APPROVED:
            raise PermissionDenied("Only approved claims can be marked as returned.")

        with transaction.atomic():
            claim.status = ItemClaim.COMPLETED
            claim.save(update_fields=["status", "updated_at"])
            claim.item.status = Item.RESOLVED
            claim.item.save(update_fields=["status", "updated_at"])
            notify_item_returned(user=claim.claimant, item_id=claim.item_id, item_title=claim.item.title)

        return Response(self.get_serializer(claim).data)

    def perform_destroy(self, instance):
        user = self.request.user
        can_delete = instance.claimant == user or instance.item.owner == user or user.is_staff
        if not can_delete:
            raise PermissionDenied("You cannot delete this claim.")
        instance.delete()


class ItemReportViewSet(viewsets.ModelViewSet):
    serializer_class = ItemReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return ItemReport.objects.select_related("item", "reporter")
        return ItemReport.objects.filter(reporter=user).select_related("item", "reporter")

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)

    def perform_update(self, serializer):
        report = self.get_object()
        user = self.request.user
        if report.reporter != user and not user.is_staff:
            raise PermissionDenied("You cannot edit this report.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.reporter != user and not user.is_staff:
            raise PermissionDenied("You cannot delete this report.")
        instance.delete()


class ItemMatchViewSet(viewsets.ModelViewSet):
    serializer_class = ItemMatchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ItemMatch.objects.select_related(
            "lost_item",
            "lost_item__owner",
            "found_item",
            "found_item__owner",
        )

        item_id = self.request.query_params.get("item")
        if item_id:
            queryset = queryset.filter(Q(lost_item_id=item_id) | Q(found_item_id=item_id))
        else:
            queryset = queryset.filter(Q(lost_item__owner=user) | Q(found_item__owner=user))

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.distinct()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        visible_matches = queryset.filter(status=ItemMatch.SUGGESTED)
        if visible_matches.exists():
            visible_matches.update(status=ItemMatch.VIEWED)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def _review_match(self, request, new_status):
        match = self.get_object()
        user = request.user

        if not (user.is_staff or match.lost_item.owner_id == user.id or match.found_item.owner_id == user.id):
            raise PermissionDenied("You cannot review this match.")

        match.status = new_status
        match.save(update_fields=["status"])
        return Response(self.get_serializer(match).data)

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        return self._review_match(request, ItemMatch.CONFIRMED)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._review_match(request, ItemMatch.REJECTED)
