from datetime import datetime
from decimal import Decimal

from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from accounts.models import Account
from .models import Transaction, TransactionCodeConfiguration, Wallet


class DashboardApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        TransactionCodeConfiguration.objects.create(
            year=datetime.now().year,
            prefix="T",
        )

        cls.admin = User.objects.create_user(
            username="admin",
            password="test-password",
            is_staff=True,
        )
        cls.customer = User.objects.create_user(
            username="customer",
            password="test-password",
            first_name="Amina",
            last_name="Njeri",
        )
        cls.other_customer = User.objects.create_user(
            username="other",
            password="test-password",
        )
        cls.account = Account.objects.get(user=cls.customer)
        cls.other_account = Account.objects.get(user=cls.other_customer)
        cls.wallet = Wallet.objects.get(account=cls.account)
        cls.wallet.balance = Decimal("1450.50")
        cls.wallet.save(update_fields=["balance", "updated_at"])

        Transaction.objects.create(
            transaction_code="T000001",
            transaction_type="deposit",
            status="completed",
            amount=Decimal("2500.00"),
            transaction_cost=Decimal("25.00"),
            destination_account=cls.account,
            reference="INV-001",
            description="Customer deposit",
        )
        Transaction.objects.create(
            transaction_code="T000002",
            transaction_type="withdrawal",
            status="pending",
            amount=Decimal("300.00"),
            source_account=cls.account,
        )
        Transaction.objects.create(
            transaction_code="T000003",
            transaction_type="send",
            status="failed",
            amount=Decimal("100.00"),
            source_account=cls.other_account,
            failure_reason="Insufficient funds",
        )

    def setUp(self):
        self.client.force_login(self.admin)

    def test_dashboard_uses_persisted_records_for_summary(self):
        response = self.client.get(reverse("api-dashboard"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["summary"],
            {
                "transactionCount": 3,
                "completedCount": 1,
                "pendingCount": 1,
                "failedCount": 1,
                "completedVolume": "2500",
                "completedFees": "25",
                "walletBalance": "1450.5",
                "walletCount": 3,
                "accountCount": 3,
            },
        )
        self.assertEqual(len(response.json()["dailyActivity"]), 7)
        self.assertEqual(response.json()["recentTransactions"][0]["code"], "T000003")

    def test_transaction_search_and_status_filters(self):
        response = self.client.get(
            reverse("api-transactions"),
            {"search": "Amina Njeri", "status": "completed"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)
        self.assertEqual(response.json()["results"][0]["sourceName"], "")
        self.assertEqual(
            response.json()["results"][0]["destinationName"], "Amina Njeri"
        )

    def test_account_users_only_see_their_own_financial_records(self):
        self.client.force_login(self.customer)

        dashboard = self.client.get(reverse("api-dashboard")).json()
        transactions = self.client.get(reverse("api-transactions")).json()
        wallets = self.client.get(reverse("api-wallets")).json()
        accounts = self.client.get(reverse("api-accounts")).json()

        self.assertEqual(dashboard["summary"]["transactionCount"], 2)
        self.assertEqual(transactions["count"], 2)
        self.assertEqual(
            {record["code"] for record in transactions["results"]},
            {"T000001", "T000002"},
        )
        self.assertEqual(wallets["count"], 1)
        self.assertEqual(accounts["count"], 1)

    def test_authenticated_profile_returns_the_current_account(self):
        self.client.force_login(self.customer)

        response = self.client.get(reverse("api-current-user"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["user"]["username"], "customer")
        self.assertEqual(response.json()["user"]["name"], "Amina Njeri")
        self.assertEqual(response.json()["user"]["accountType"], "individual")

    def test_financial_apis_require_authentication(self):
        self.client.logout()

        for route in (
            "api-dashboard",
            "api-transactions",
            "api-transaction-export",
            "api-wallets",
            "api-accounts",
        ):
            with self.subTest(route=route):
                response = self.client.get(reverse(route))
                self.assertEqual(response.status_code, 401)

    def test_sign_out_invalidates_the_session(self):
        response = self.client.post(reverse("api-logout"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": True})
        self.assertEqual(
            self.client.get(reverse("api-current-user")).status_code,
            401,
        )

    def test_invalid_transaction_filter_is_rejected(self):
        response = self.client.get(
            reverse("api-transactions"),
            {"status": "unknown"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_transaction_export_is_a_real_csv_download(self):
        response = self.client.get(reverse("api-transaction-export"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/csv; charset=utf-8")
        self.assertIn(b"T000001", response.content)
        self.assertIn(b"INV-001", response.content)

    def test_login_creates_a_session_for_valid_credentials(self):
        self.client.logout()

        response = self.client.post(
            reverse("api-login"),
            data='{"username":"admin","password":"test-password"}',
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["user"]["isStaff"])
        self.assertEqual(
            self.client.get(reverse("api-current-user")).status_code,
            200,
        )

    def test_login_requires_a_valid_csrf_token(self):
        client = Client(enforce_csrf_checks=True)
        token_response = client.get(reverse("api-csrf"))
        csrf_token = token_response.json()["csrfToken"]
        login_url = reverse("api-login")
        body = '{"username":"admin","password":"test-password"}'

        rejected = client.post(
            login_url,
            data=body,
            content_type="application/json",
        )
        accepted = client.post(
            login_url,
            data=body,
            content_type="application/json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )

        self.assertEqual(rejected.status_code, 403)
        self.assertIn("error", rejected.json())
        self.assertEqual(accepted.status_code, 200)

    def test_api_rejects_unknown_account_type(self):
        response = self.client.get(
            reverse("api-accounts"),
            {"type": "unknown"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())
