"""
SM-2 spaced repetition algorithm (the same scheduling algorithm used by Anki
in its original form). Given how well the learner recalled a card, this
computes the new ease factor, interval, and next review date.

Reference: https://en.wikipedia.org/wiki/SuperMemo#Description_of_SM-2_algorithm
"""
from datetime import datetime, timedelta
from typing import Tuple


def schedule_next_review(
    quality: int,
    ease_factor: float,
    interval_days: int,
    repetitions: int,
) -> Tuple[float, int, int, datetime]:
    """
    Compute the next review schedule for a flashcard.

    Args:
        quality: How well the learner recalled the card, 0-5.
                 0-2 = failed / forgot, 3-5 = recalled successfully
                 (0=blackout, 3=hard-but-correct, 5=perfect)
        ease_factor: Current ease factor (starts at 2.5)
        interval_days: Current interval in days
        repetitions: Number of consecutive successful reviews

    Returns:
        (new_ease_factor, new_interval_days, new_repetitions, next_review_at)
    """
    if quality < 0 or quality > 5:
        raise ValueError("quality must be between 0 and 5")

    if quality < 3:
        # Failed recall: reset progress, review again tomorrow
        new_repetitions = 0
        new_interval = 1
    else:
        new_repetitions = repetitions + 1
        if new_repetitions == 1:
            new_interval = 1
        elif new_repetitions == 2:
            new_interval = 6
        else:
            new_interval = round(interval_days * ease_factor)

    # Update ease factor (never drops below 1.3)
    new_ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ease_factor = max(1.3, new_ease_factor)

    next_review_at = datetime.utcnow() + timedelta(days=new_interval)

    return new_ease_factor, new_interval, new_repetitions, next_review_at
