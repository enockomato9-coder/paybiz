import random
import string


RESERVED_ACCOUNT_NUMBERS = {
    "PBZ00000001",
}


def generate_account_number():
    """
    Generate a unique PayBiz account number.

    Rules:
    - Total length: 10 to 13 characters
    - Maximum 4 letters
    - Remaining characters are digits
    """

    from .models import Account

    while True:
        total_length = random.randint(10, 13)
        letter_count = random.randint(1, min(4, total_length - 1))
        digit_count = total_length - letter_count

        letters = "".join(
            random.choices(string.ascii_uppercase, k=letter_count)
        )

        digits = "".join(
            random.choices(string.digits, k=digit_count)
        )

        account_number = letters + digits

        if account_number in RESERVED_ACCOUNT_NUMBERS:
            continue

        if not Account.objects.filter(
            account_number=account_number
        ).exists():
            return account_number