from django.contrib.auth.models import User
from django.db import models


class IndividualProfile(models.Model):
    """
    PayBiz profile containing information specific to an individual user.
    Authentication remains handled by Django's built-in User model.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="individual_profile",
    )

    phone_number = models.CharField(
        max_length=20,
        unique=True,
    )

    is_verified = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.user.username