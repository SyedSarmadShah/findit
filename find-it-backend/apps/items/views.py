from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import Item, ItemClaim, ItemReport
from .serializers import ItemClaimSerializer, ItemReportSerializer, ItemSerializer


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
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.owner != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You cannot edit this item.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner != self.request.user and not self.request.user.is_staff:
            raise PermissionDenied("You cannot delete this item.")
        instance.delete()


class ItemClaimViewSet(viewsets.ModelViewSet):
    serializer_class = ItemClaimSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ItemClaim.objects.filter(item__owner=user) | ItemClaim.objects.filter(claimant=user)

    def perform_create(self, serializer):
        item = serializer.validated_data["item"]
        user = self.request.user

        if item.owner == user:
            raise PermissionDenied("You cannot claim your own item.")

        if item.status == Item.RESOLVED:
            raise PermissionDenied("This item is already resolved.")

        serializer.save(claimant=user)

    def perform_update(self, serializer):
        claim = self.get_object()
        user = self.request.user

        can_review = claim.item.owner == user or user.is_staff
        if not can_review:
            raise PermissionDenied("Only the item owner can review claims.")

        serializer.save()

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
