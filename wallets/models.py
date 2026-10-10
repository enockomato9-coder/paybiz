from decimal import Decimal

from django.core.validators import RegexValidator
from django.db import models

from accounts.models import Account


class Wallet(models.Model):
    """
    Stores the monetary balance belonging to a PayBiz account.
    """

    account = models.OneToOneField(
        Account,
        on_delete=models.CASCADE,
        related_name="wallet",
    )

    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    currency = models.CharField(
        max_length=3,
        default="KES",
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
        return f"{self.account.account_number} - {self.currency} {self.balance}"


class Transaction(models.Model):
    """
    Records a financial transaction within PayBiz.
    """

    TRANSACTION_TYPES = (
        ("deposit", "Deposit"),
        ("send", "Send"),
        ("withdrawal", "Withdrawal"),
    )

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    )

    transaction_code = models.CharField(
        max_length=7,
        unique=True,
        validators=[
            RegexValidator(
                regex=r"^[A-Z][A-Z0-9]{6}$",
                message=(
                    "Transaction code must be exactly 7 characters, "
                    "starting with an uppercase letter and followed "
                    "by 6 uppercase letters or numbers."
                ),
            )
        ],
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )

    transaction_cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    source_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="outgoing_transactions",
        null=True,
        blank=True,
    )

    destination_account = models.ForeignKey(
        Account,
        on_delete=models.PROTECT,
        related_name="incoming_transactions",
        null=True,
        blank=True,
    )

    reference = models.CharField(
        max_length=100,
        blank=True,
    )

    description = models.CharField(
        max_length=255,
        blank=True,
    )

    failure_reason = models.CharField(
        max_length=255,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def save(self, *args, **kwargs):
        """
        Automatically generate a transaction code
        when a new transaction is created.
        """

        if not self.transaction_code:
            from .utils import generate_transaction_code

            self.transaction_code = generate_transaction_code()

        super().save(*args, **kwargs)

    def __str__(self):
        return self.transaction_code


class TransactionCodeConfiguration(models.Model):
    """
    Stores the fixed first character used by PayBiz
    transaction codes for a specific year.
    """

    year = models.PositiveIntegerField(
        unique=True,
    )

    prefix = models.CharField(
        max_length=1,
        validators=[
            RegexValidator(
                regex=r"^[A-Z]$",
                message="Prefix must be exactly one uppercase letter.",
            )
        ],
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"{self.year} - {self.prefix}"


class TransactionFee(models.Model):
    """
    Defines an administrator-controlled transaction cost range.
    """

    TRANSACTION_TYPES = (
        ("send", "Send"),
        ("withdrawal", "Withdrawal"),
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPES,
    )

    minimum_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )

    maximum_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )

    cost = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
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
        return (
            f"{self.transaction_type} | "
            f"Ksh {self.minimum_amount} - "
            f"Ksh {self.maximum_amount} | "
            f"Cost Ksh {self.cost}"
        )

class TransactionLimitConfiguration(models.Model):
    """
    Stores PayBiz transaction limits controlled by the administrator.
    """

    minimum_withdrawal_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("50.00"),
    )

    daily_outgoing_limit = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("500000.00"),
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
        return (
            f"Minimum withdrawal: Ksh {self.minimum_withdrawal_amount} | "
            f"Daily outgoing limit: Ksh {self.daily_outgoing_limit}"
        )

class PlatformLedgerEntry(models.Model):
    """
    Records money entering or leaving the PayBiz platform wallet.

    Ledger entries are historical financial records and should
    not be edited or deleted through the admin panel.
    """

    ENTRY_TYPES = (
        ("admin_funding", "Admin Funding"),
        ("transaction_fee", "Transaction Fee"),
        ("platform_outgoing", "Platform Outgoing"),
    )

    entry_type = models.CharField(
        max_length=30,
        choices=ENTRY_TYPES,
    )

    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )

    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="platform_ledger_entry",
    )

    reference = models.CharField(
        max_length=100,
        blank=True,
    )

    description = models.CharField(
        max_length=255,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return (
            f"{self.entry_type} | "
            f"Ksh {self.amount} | "
            f"{self.created_at}"
        )            

class PlatformFunding(models.Model):
    """
    Records funds added to the PayBiz platform wallet
    by an authorized administrator.
    """

    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )

    reference = models.CharField(
        max_length=100,
        unique=True,
    )

    description = models.CharField(
        max_length=255,
        blank=True,
    )

    created_by = models.ForeignKey(
        "auth.User",
        on_delete=models.PROTECT,
        related_name="platform_fundings",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self):
        return (
            f"Admin Funding | "
            f"Ksh {self.amount} | "
            f"{self.reference}"
        )