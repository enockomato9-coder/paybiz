from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Account
from .utils import generate_account_number


@receiver(post_save, sender=User)
def create_paybiz_account(sender, instance, created, **kwargs):
    if created:
        Account.objects.create(
            user=instance,
            account_number=generate_account_number(),
        )