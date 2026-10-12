import csv
import json
from datetime import timedelta
from decimal import Decimal
from json import JSONDecodeError

from django.contrib.auth import authenticate, login, logout
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.csrf import csrf_failure as django_csrf_failure
from django.views.decorators.http import require_GET, require_POST

from accounts.models import Account
from .models import Transaction, Wallet


def _json_error(message, status):
    return JsonResponse({"error": message}, status=status)


def _request_json(request):
    try:
        return json.loads(request.body)
    except (JSONDecodeError, UnicodeDecodeError):
        return None


def csrf_failure(request, reason=""):
    if request.path.startswith("/api/"):
        return _json_error(
            "Your security token has expired. Refresh the page and try again.",
            403,
        )
    return django_csrf_failure(request, reason=reason)


def _visible_transactions(request):
    transactions = Transaction.objects.select_related(
        "source_account__user",
        "destination_account__user",
    )
    if request.user.is_staff:
        return transactions
    return transactions.filter(
        Q(source_account__user=request.user)
        | Q(destination_account__user=request.user)
    )


def _visible_wallets(request):
    wallets = Wallet.objects.select_related("account__user")
    if request.user.is_staff:
        return wallets
    return wallets.filter(account__user=request.user)


def _visible_accounts(request):
    accounts = Account.objects.select_related("user", "wallet")
    if request.user.is_staff:
        return accounts
    return accounts.filter(user=request.user)


def _transaction_filters(request, transactions):
    status = request.GET.get("status", "").strip().lower()
    transaction_type = request.GET.get("type", "").strip().lower()
    search = request.GET.get("search", "").strip()

    if status:
        if status not in dict(Transaction.STATUS_CHOICES):
            return None, "Unsupported transaction status."
        transactions = transactions.filter(status=status)

    if transaction_type:
        if transaction_type not in dict(Transaction.TRANSACTION_TYPES):
            return None, "Unsupported transaction type."
        transactions = transactions.filter(transaction_type=transaction_type)

    for search_term in search.split():
        transactions = transactions.filter(
            Q(transaction_code__icontains=search_term)
            | Q(reference__icontains=search_term)
            | Q(description__icontains=search_term)
            | Q(source_account__user__username__icontains=search_term)
            | Q(source_account__user__first_name__icontains=search_term)
            | Q(source_account__user__last_name__icontains=search_term)
            | Q(destination_account__user__username__icontains=search_term)
            | Q(destination_account__user__first_name__icontains=search_term)
            | Q(destination_account__user__last_name__icontains=search_term)
        )

    return transactions, None


def _serialize_transaction(transaction):
    source = transaction.source_account
    destination = transaction.destination_account

    def account_name(account):
        if account is None:
            return ""
        user = account.user
        return user.get_full_name().strip() or user.get_username()

    return {
        "id": transaction.pk,
        "code": transaction.transaction_code,
        "type": transaction.transaction_type,
        "typeLabel": transaction.get_transaction_type_display(),
        "status": transaction.status,
        "statusLabel": transaction.get_status_display(),
        "amount": str(transaction.amount),
        "fee": str(transaction.transaction_cost),
        "sourceAccount": source.account_number if source else "",
        "sourceName": account_name(source),
        "destinationAccount": destination.account_number if destination else "",
        "destinationName": account_name(destination),
        "reference": transaction.reference,
        "description": transaction.description,
        "failureReason": transaction.failure_reason,
        "createdAt": transaction.created_at.isoformat(),
    }


def _serialize_wallet(wallet):
    user = wallet.account.user
    return {
        "id": wallet.pk,
        "accountNumber": wallet.account.account_number,
        "owner": user.get_full_name().strip() or user.get_username(),
        "accountType": wallet.account.account_type,
        "balance": str(wallet.balance),
        "currency": wallet.currency,
        "active": wallet.is_active and wallet.account.is_active,
        "createdAt": wallet.created_at.isoformat(),
        "updatedAt": wallet.updated_at.isoformat(),
    }


def _serialize_account(account):
    user = account.user
    wallet = getattr(account, "wallet", None)
    return {
        "id": account.pk,
        "accountNumber": account.account_number,
        "name": user.get_full_name().strip() or user.get_username(),
        "email": user.email,
        "username": user.get_username(),
        "accountType": account.account_type,
        "accountTypeLabel": account.get_account_type_display(),
        "active": account.is_active and user.is_active,
        "createdAt": account.created_at.isoformat(),
        "balance": str(wallet.balance) if wallet else None,
        "currency": wallet.currency if wallet else None,
    }


@require_GET
def csrf_token(request):
    return JsonResponse({"csrfToken": get_token(request)})


@require_GET
def current_user(request):
    if not request.user.is_authenticated:
        return _json_error("Authentication is required.", 401)

    account = getattr(request.user, "paybiz_account", None)
    return JsonResponse(
        {
            "user": {
                "id": request.user.pk,
                "name": request.user.get_full_name().strip()
                or request.user.get_username(),
                "username": request.user.get_username(),
                "email": request.user.email,
                "isStaff": request.user.is_staff,
                "accountType": account.account_type if account else None,
            }
        }
    )


@require_POST
def sign_in(request):
    payload = _request_json(request)
    if not isinstance(payload, dict):
        return _json_error("Submit a valid JSON request.", 400)

    username = payload.get("username")
    password = payload.get("password")
    if not isinstance(username, str) or not isinstance(password, str):
        return _json_error("Username and password are required.", 400)

    user = authenticate(request, username=username.strip(), password=password)
    if user is None:
        return _json_error("The username or password is incorrect.", 401)

    login(request, user)
    return JsonResponse(
        {
            "user": {
                "id": user.pk,
                "name": user.get_full_name().strip() or user.get_username(),
                "username": user.get_username(),
                "email": user.email,
                "isStaff": user.is_staff,
                "accountType": getattr(
                    getattr(user, "paybiz_account", None), "account_type", None
                ),
            }
        }
    )


@require_POST
def sign_out(request):
    if not request.user.is_authenticated:
        return _json_error("Authentication is required.", 401)
    logout(request)
    return JsonResponse({"ok": True})


@require_GET
def dashboard_summary(request):
    if not request.user.is_authenticated:
        return _json_error("Authentication is required.", 401)

    transactions = _visible_transactions(request)
    completed = transactions.filter(status="completed")
    totals = transactions.aggregate(
        count=Count("id"),
        completed_count=Count("id", filter=Q(status="completed")),
        pending_count=Count("id", filter=Q(status="pending")),
        failed_count=Count("id", filter=Q(status="failed")),
        volume=Sum("amount", filter=Q(status="completed")),
        fees=Sum("transaction_cost", filter=Q(status="completed")),
    )
    wallet_totals = _visible_wallets(request).filter(
        is_active=True,
        account__is_active=True,
    ).aggregate(balance=Sum("balance"), count=Count("id"))

    start_date = timezone.localdate() - timedelta(days=6)
    activity = (
        completed.filter(created_at__date__gte=start_date)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(volume=Sum("amount"), count=Count("id"))
        .order_by("day")
    )
    activity_by_day = {
        entry["day"].isoformat(): entry for entry in activity
    }
    daily_activity = []
    for offset in range(7):
        day = start_date + timedelta(days=offset)
        entry = activity_by_day.get(day.isoformat(), {})
        daily_activity.append(
            {
                "date": day.isoformat(),
                "label": day.strftime("%a"),
                "volume": str(entry.get("volume") or Decimal("0.00")),
                "count": entry.get("count", 0),
            }
        )

    types = (
        transactions.values("transaction_type")
        .annotate(count=Count("id"))
        .order_by("transaction_type")
    )

    return JsonResponse(
        {
            "summary": {
                "transactionCount": totals["count"] or 0,
                "completedCount": totals["completed_count"] or 0,
                "pendingCount": totals["pending_count"] or 0,
                "failedCount": totals["failed_count"] or 0,
                "completedVolume": str(totals["volume"] or Decimal("0.00")),
                "completedFees": str(totals["fees"] or Decimal("0.00")),
                "walletBalance": str(
                    wallet_totals["balance"] or Decimal("0.00")
                ),
                "walletCount": wallet_totals["count"] or 0,
                "accountCount": _visible_accounts(request).count(),
            },
            "dailyActivity": daily_activity,
            "transactionTypes": [
                {
                    "type": row["transaction_type"],
                    "label": dict(Transaction.TRANSACTION_TYPES)[
                        row["transaction_type"]
                    ],
                    "count": row["count"],
                }
                for row in types
            ],
            "recentTransactions": [
                _serialize_transaction(transaction)
                for transaction in transactions.order_by("-created_at", "-pk")[:8]
            ],
        }
    )


@require_GET
def transaction_list(request):
    if not request.user.is_authenticated:
        return _json_error("Authentication is required.", 401)

    transactions, error = _transaction_filters(
        request, _visible_transactions(request)
    )
    if error:
        return _json_error(error, 400)

    try:
        page = int(request.GET.get("page", "1"))
        page_size = int(request.GET.get("page_size", "20"))
    except ValueError:
        return _json_error("Page and page_size must be whole numbers.", 400)

    if page < 1 or page_size < 1 or page_size > 100:
        return _json_error(
            "Page must be positive and page_size must be between 1 and 100.",
            400,
        )

    transactions = transactions.order_by("-created_at", "-pk")
    count = transactions.count()
    start = (page - 1) * page_size
    records = transactions[start : start + page_size]
    return JsonResponse(
        {
            "count": count,
            "page": page,
            "pageSize": page_size,
            "results": [
                _serialize_transaction(transaction) for transaction in records
            ],
        }
    )


@require_GET
def transaction_export(request):
    if not request.user.is_authenticated:
        return _json_error("Authentication is required.", 401)

    transactions, error = _transaction_filters(
        request, _visible_transactions(request)
    )
    if error:
        return _json_error(error, 400)

    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="paybiz-transactions.csv"'
    writer = csv.writer(response)
    writer.writerow(
        [
            "Transaction code",
            "Type",
            "Status",
            "Amount (KES)",
            "Fee (KES)",
            "Source account",
            "Source name",
            "Destination account",
            "Destination name",
            "Reference",
            "Description",
            "Created at",
        ]
    )
    for transaction in transactions.order_by("-created_at", "-pk").iterator():
        row = _serialize_transaction(transaction)
        writer.writerow(
            [
                row["code"],
                row["typeLabel"],
                row["statusLabel"],
                row["amount"],
                row["fee"],
                row["sourceAccount"],
                row["sourceName"],
                row["destinationAccount"],
                row["destinationName"],
                row["reference"],
                row["description"],
                row["createdAt"],
            ]
        )
    return response


@require_GET
def wallet_list(request):
    if not request.user.is_authenticated:
        return _json_error("Authentication is required.", 401)
    wallets = _visible_wallets(request).order_by("-created_at")
    return JsonResponse(
        {
            "count": wallets.count(),
            "results": [_serialize_wallet(wallet) for wallet in wallets],
        }
    )


@require_GET
def account_list(request):
    if not request.user.is_authenticated:
        return _json_error("Authentication is required.", 401)

    accounts = _visible_accounts(request)
    account_type = request.GET.get("type", "").strip().lower()
    if account_type:
        if account_type not in dict(Account.ACCOUNT_TYPES):
            return _json_error("Unsupported account type.", 400)
        accounts = accounts.filter(account_type=account_type)

    accounts = accounts.order_by("-created_at")
    return JsonResponse(
        {
            "count": accounts.count(),
            "results": [_serialize_account(account) for account in accounts],
        }
    )
