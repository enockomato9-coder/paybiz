from django.contrib.auth.models import User
from django.db import models


class Account(models.Model):
    """
    Represents a financial/application account inside PayBiz.

    Django's built-in User model handles authentication.
    This model handles PayBiz-specific account identity.
    """

    ACCOUNT_TYPES = (
    ("individual", "Individual"),
    ("agent", "Agent"),
    ("business", "Business"),
    ("platform", "Platform"),
)

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="paybiz_account",
    )

    account_number = models.CharField(
        max_length=13,
        unique=True,
    )

    account_type = models.CharField(
        max_length=20,
        choices=ACCOUNT_TYPES,
        default="individual",
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.account_number