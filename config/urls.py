"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path

from wallets import views as wallet_views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/csrf/", wallet_views.csrf_token, name="api-csrf"),
    path("api/auth/me/", wallet_views.current_user, name="api-current-user"),
    path("api/auth/login/", wallet_views.sign_in, name="api-login"),
    path("api/auth/logout/", wallet_views.sign_out, name="api-logout"),
    path("api/dashboard/", wallet_views.dashboard_summary, name="api-dashboard"),
    path(
        "api/transactions/",
        wallet_views.transaction_list,
        name="api-transactions",
    ),
    path(
        "api/transactions/export.csv",
        wallet_views.transaction_export,
        name="api-transaction-export",
    ),
    path("api/wallets/", wallet_views.wallet_list, name="api-wallets"),
    path("api/accounts/", wallet_views.account_list, name="api-accounts"),
]
