from django.contrib import admin

from .models import (
    PlatformLedgerEntry,
    Transaction,
    TransactionCodeConfiguration,
    TransactionFee,
    TransactionLimitConfiguration,
    Wallet,
)


@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = (
        "account",
        "balance",
        "currency",
        "is_active",
        "created_at",
    )

    list_filter = (
        "currency",
        "is_active",
    )

    search_fields = (
        "account__account_number",
    )


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_code",
        "transaction_type",
        "status",
        "amount",
        "transaction_cost",
        "source_account",
        "destination_account",
        "created_at",
    )

    list_filter = (
        "transaction_type",
        "status",
    )

    search_fields = (
        "transaction_code",
        "reference",
        "source_account__account_number",
        "destination_account__account_number",
    )

    readonly_fields = (
        "transaction_code",
        "created_at",
        "updated_at",
    )


@admin.register(TransactionCodeConfiguration)
class TransactionCodeConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        "year",
        "prefix",
        "created_at",
        "updated_at",
    )

    search_fields = (
        "year",
        "prefix",
    )

    ordering = (
        "-year",
    )

@admin.register(TransactionFee)
class TransactionFeeAdmin(admin.ModelAdmin):
    list_display = (
        "transaction_type",
        "minimum_amount",
        "maximum_amount",
        "cost",
        "is_active",
        "created_at",
    )

    list_filter = (
        "transaction_type",
        "is_active",
    )

    search_fields = (
        "transaction_type",
    )

    ordering = (
        "transaction_type",
        "minimum_amount",
    )

@admin.register(TransactionLimitConfiguration)
class TransactionLimitConfigurationAdmin(admin.ModelAdmin):
    list_display = (
        "minimum_withdrawal_amount",
        "daily_outgoing_limit",
        "is_active",
        "created_at",
        "updated_at",
    )

    list_filter = (
        "is_active",
    )

    ordering = (
        "-created_at",
    )  

@admin.register(PlatformLedgerEntry)
class PlatformLedgerEntryAdmin(admin.ModelAdmin):
    list_display = (
        "entry_type",
        "amount",
        "transaction",
        "reference",
        "created_at",
    )

    list_filter = (
        "entry_type",
    )

    search_fields = (
        "reference",
        "transaction__transaction_code",
        "description",
    )

    readonly_fields = (
        "entry_type",
        "amount",
        "transaction",
        "reference",
        "description",
        "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False      