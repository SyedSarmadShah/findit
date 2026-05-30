from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import timedelta
from typing import Iterable

from django.db import transaction
from django.db.models import Q

from apps.messaging.services import notify_new_match

from .models import Item, ItemMatch


TOKEN_RE = re.compile(r"[a-z0-9]+")
STOPWORDS = {
    "and",
    "for",
    "from",
    "the",
    "with",
    "near",
    "over",
    "under",
    "item",
    "lost",
    "found",
    "missing",
}


@dataclass(frozen=True)
class MatchBreakdown:
    score: int
    category_score: int
    title_score: int
    description_score: int
    location_score: int
    date_score: int
    match_reason: str


def _normalize_text(value: str | None) -> str:
    return (value or "").strip().lower()


def _tokenize(*values: str | None) -> set[str]:
    tokens: set[str] = set()
    for value in values:
        for token in TOKEN_RE.findall(_normalize_text(value)):
            if len(token) > 2 and token not in STOPWORDS:
                tokens.add(token)
    return tokens


def _shared_tokens(first: Iterable[str], second: Iterable[str]) -> list[str]:
    return sorted(set(first).intersection(set(second)))


def _overlap_score(first: set[str], second: set[str], max_points: int) -> int:
    if not first or not second:
        return 0
    union = len(first.union(second))
    if union == 0:
        return 0
    ratio = len(first.intersection(second)) / union
    return min(max_points, round(max_points * ratio))


def _date_score(first: Item, second: Item) -> tuple[int, int]:
    if not first.date or not second.date:
        return 0, 0

    diff_days = abs((first.date - second.date).days)
    if diff_days <= 3:
        return 10, diff_days
    if diff_days <= 7:
        return 8, diff_days
    if diff_days <= 14:
        return 6, diff_days
    if diff_days <= 30:
        return 3, diff_days
    return 0, diff_days


def _build_reason(item: Item, candidate: Item) -> MatchBreakdown:
    category_tokens = _tokenize(item.category)
    candidate_category_tokens = _tokenize(candidate.category)
    title_tokens = _tokenize(item.title)
    candidate_title_tokens = _tokenize(candidate.title)
    description_tokens = _tokenize(item.description)
    candidate_description_tokens = _tokenize(candidate.description)
    location_tokens = _tokenize(item.location)
    candidate_location_tokens = _tokenize(candidate.location)

    category_score = _overlap_score(category_tokens, candidate_category_tokens, 40)
    title_score = _overlap_score(title_tokens, candidate_title_tokens, 15)
    description_score = _overlap_score(description_tokens, candidate_description_tokens, 15)
    location_score = _overlap_score(location_tokens, candidate_location_tokens, 20)
    date_score, diff_days = _date_score(item, candidate)

    shared_title = _shared_tokens(title_tokens, candidate_title_tokens)[:4]
    shared_description = _shared_tokens(description_tokens, candidate_description_tokens)[:4]
    shared_category = _shared_tokens(category_tokens, candidate_category_tokens)[:3]
    shared_location = _shared_tokens(location_tokens, candidate_location_tokens)[:3]

    reason_parts: list[str] = []
    if category_score:
        reason_parts.append(f"Category overlap: {', '.join(shared_category) if shared_category else 'similar listing category'}")
    if title_score:
        reason_parts.append(f"Title keywords: {', '.join(shared_title)}")
    if description_score:
        reason_parts.append(f"Description keywords: {', '.join(shared_description)}")
    if location_score:
        reason_parts.append(f"Location overlap: {', '.join(shared_location) if shared_location else 'nearby location'}")
    if date_score:
        reason_parts.append(f"Date proximity: within {diff_days} day(s)")

    total_score = category_score + title_score + description_score + location_score + date_score
    return MatchBreakdown(
        score=min(total_score, 100),
        category_score=category_score,
        title_score=title_score,
        description_score=description_score,
        location_score=location_score,
        date_score=date_score,
        match_reason="; ".join(reason_parts) if reason_parts else "No strong similarity signals.",
    )


def _candidate_queryset(item: Item):
    opposite_type = Item.FOUND if item.item_type == Item.LOST else Item.LOST
    queryset = Item.objects.filter(item_type=opposite_type).exclude(owner=item.owner).exclude(pk=item.pk)

    if item.date:
        start = item.date - timedelta(days=90)
        end = item.date + timedelta(days=90)
        queryset = queryset.filter(date__range=(start, end))

    category_tokens = _tokenize(item.category)
    if category_tokens:
        category_filter = Q()
        for token in list(category_tokens)[:4]:
            category_filter |= Q(category__icontains=token)
        queryset = queryset.filter(category_filter | Q(category="") | Q(category__isnull=True))

    return queryset.select_related("owner")


def _ensure_match_visibility(item_match: ItemMatch) -> None:
    updated_items = []
    for item in (item_match.lost_item, item_match.found_item):
        if item.status == Item.OPEN:
            item.status = Item.MATCHED
            updated_items.append(item)

    if updated_items:
        Item.objects.bulk_update(updated_items, ["status", "updated_at"])


def _notify_match(item_match: ItemMatch) -> None:
    notify_new_match(
        lost_owner=item_match.lost_item.owner,
        found_owner=item_match.found_item.owner,
        match_id=item_match.id,
        item_title=item_match.found_item.title if item_match.lost_item.item_type == Item.LOST else item_match.lost_item.title,
        score=item_match.score,
    )


def create_matches_for_item(item: Item) -> list[ItemMatch]:
    matches: list[ItemMatch] = []
    with transaction.atomic():
        for candidate in _candidate_queryset(item):
            lost_item = item if item.item_type == Item.LOST else candidate
            found_item = item if item.item_type == Item.FOUND else candidate
            breakdown = _build_reason(lost_item, found_item)
            if breakdown.score <= 70:
                continue

            item_match, created = ItemMatch.objects.get_or_create(
                lost_item=lost_item,
                found_item=found_item,
                defaults={
                    "score": breakdown.score,
                    "status": ItemMatch.SUGGESTED,
                    "match_reason": breakdown.match_reason,
                },
            )

            if not created and breakdown.score > item_match.score:
                item_match.score = breakdown.score
                item_match.match_reason = breakdown.match_reason
                if item_match.status == ItemMatch.REJECTED:
                    item_match.status = ItemMatch.SUGGESTED
                item_match.save(update_fields=["score", "match_reason", "status"])

            _ensure_match_visibility(item_match)

            if created:
                _notify_match(item_match)

            matches.append(item_match)

    return matches
