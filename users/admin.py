from django.contrib import admin
from .models import IndividualProfile


@admin.register(IndividualProfile)
class IndividualProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "phone_number",
        "is_verified",
        "created_at",
    )

    list_filter = (
        "is_verified",
    )

    search_fields = (
        "user__username",
        "phone_number",
    )