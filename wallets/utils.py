import random
import string
from datetime import datetime

from .models import Transaction, TransactionCodeConfiguration


def generate_transaction_code():
    """
    Generate a unique PayBiz transaction code.

    Rules:
    - Exactly 7 characters
    - First character comes from the admin configuration for the current year
    - Remaining 6 characters are random uppercase letters/numbers
    - Unique across all PayBiz transactions
    """

    current_year = datetime.now().year

    try:
        configuration = TransactionCodeConfiguration.objects.get(
            year=current_year
        )
    except TransactionCodeConfiguration.DoesNotExist:
        raise ValueError(
            f"No transaction-code configuration exists for {current_year}."
        )

    prefix = configuration.prefix

    characters = string.ascii_uppercase + string.digits

    while True:
        random_part = "".join(
            random.choices(characters, k=6)
        )

        transaction_code = prefix + random_part

        if not Transaction.objects.filter(
            transaction_code=transaction_code
        ).exists():
            return transaction_code

from decimal import Decimal

from .models import TransactionFee


def calculate_transaction_cost(transaction_type, amount):
    """
    Find the administrator-defined transaction cost
    for a given transaction type and amount.
    """

    amount = Decimal(str(amount))

    fee = (
        TransactionFee.objects
        .filter(
            transaction_type=transaction_type,
            minimum_amount__lte=amount,
            maximum_amount__gte=amount,
            is_active=True,
        )
        .first()
    )

    if fee is None:
        raise ValueError(
            f"No active transaction fee is configured for "
            f"{transaction_type} of Ksh {amount}."
        )

    return fee.cost            