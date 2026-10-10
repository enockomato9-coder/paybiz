from decimal import Decimal

from django.contrib.auth.models import User
from django.db import transaction

from .models import PlatformFunding, PlatformLedgerEntry, Wallet
from accounts.models import Account


PLATFORM_ACCOUNT_NUMBER = "PBZ00000001"


@transaction.atomic
def fund_platform(
    *,
    amount: Decimal,
    reference: str,
    created_by: User,
    description: str = "",
):
    """
    Add funds to the PayBiz platform wallet.

    This operation:
    1. Validates the funding amount.
    2. Creates a PlatformFunding record.
    3. Increases the platform wallet balance.
    4. Creates an immutable platform ledger entry.

    All four operations succeed or fail together.
    """

    amount = Decimal(amount)

    if amount <= Decimal("0.00"):
        raise ValueError("Funding amount must be greater than zero.")

    reference = reference.strip()

    if not reference:
        raise ValueError("Funding reference is required.")

    if PlatformFunding.objects.filter(reference=reference).exists():
        raise ValueError(
            f"A platform funding record with reference "
            f"'{reference}' already exists."
        )

    try:
        platform_account = Account.objects.get(
            account_number=PLATFORM_ACCOUNT_NUMBER
        )
    except Account.DoesNotExist:
        raise ValueError(
            f"Platform account {PLATFORM_ACCOUNT_NUMBER} does not exist."
        )

    platform_wallet = (
        Wallet.objects.select_for_update()
        .get(account=platform_account)
    )

    funding = PlatformFunding.objects.create(
        amount=amount,
        reference=reference,
        description=description,
        created_by=created_by,
    )

    platform_wallet.balance += amount
    platform_wallet.save(update_fields=["balance", "updated_at"])

    PlatformLedgerEntry.objects.create(
        entry_type="admin_funding",
        amount=amount,
        reference=reference,
        description=description,
    )

    return funding
