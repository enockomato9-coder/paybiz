from django.contrib import admin

from .models import Account


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = (
        "account_number",
        "user",
        "account_type",
        "is_active",
        "created_at",
    )

    list_filter = (
        "account_type",
        "is_active",
    )

    search_fields = (
        "account_number",
        "user__username",
    )