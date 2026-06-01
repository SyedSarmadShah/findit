from __future__ import annotations

from django.contrib.auth import get_user_model

from .models import Notification

User = get_user_model()


def create_notification(*, user: User, notification_type: str, title: str, message: str, reference_id: int | None = None) -> Notification:
    return Notification.objects.create(
        user=user,
        type=notification_type,
        title=title,
        message=message,
        reference_id=reference_id,
    )


def notify_new_match(*, lost_owner: User, found_owner: User, match_id: int, item_title: str, score: int) -> None:
    recipients = {lost_owner.id: lost_owner, found_owner.id: found_owner}
    for recipient in recipients.values():
        create_notification(
            user=recipient,
            notification_type=Notification.NEW_MATCH_FOUND,
            title="New match found",
            message=f"We found a potential match for {item_title} with a score of {score}%.",
            reference_id=match_id,
        )


def notify_claim_received(*, user: User, claim_id: int, item_title: str, claimant_email: str) -> None:
    create_notification(
        user=user,
        notification_type=Notification.CLAIM_REQUEST_RECEIVED,
        title="Claim request received",
        message=f"{claimant_email} submitted a claim for {item_title}.",
        reference_id=claim_id,
    )


def notify_claim_reviewed(
    *,
    user: User,
    claim_id: int,
    item_title: str,
    approved: bool,
    reviewer_name: str | None = None,
    contact_phone: str | None = None,
    pickup_location: str | None = None,
) -> None:
    message = f"Your claim for {item_title} was {'approved' if approved else 'rejected'}."
    if approved:
        if reviewer_name:
            message = f"Your claim for {item_title} was approved by {reviewer_name}."
        extras = []
        if contact_phone:
            extras.append(f"Contact number: {contact_phone}")
        if pickup_location:
            extras.append(f"Pickup location: {pickup_location}")
        if extras:
            message = message + " " + " ".join(extras)

    create_notification(
        user=user,
        notification_type=Notification.CLAIM_APPROVED if approved else Notification.CLAIM_REJECTED,
        title="Claim approved" if approved else "Claim rejected",
        message=message,
        reference_id=claim_id,
    )


def notify_item_returned(*, user: User, item_id: int, item_title: str) -> None:
    create_notification(
        user=user,
        notification_type=Notification.ITEM_RETURNED,
        title="Item returned",
        message=f"Your item {item_title} has been marked as returned.",
        reference_id=item_id,
    )