"""
Blog service layer for business logic and helper functions.
"""
from recommendations.models import UserInteraction


# Interaction rating constants
INTERACTION_RATINGS = {
    'view': 1.0,
    'comment': 3.0,
    'like': 4.0,
    'bookmark': 5.0,
}


def track_user_interaction(user, blog, interaction_type):
    """
    Track a user interaction with a blog post.

    Args:
        user: The user performing the interaction
        blog: The blog being interacted with
        interaction_type: One of 'view', 'comment', 'like', 'bookmark'

    Returns:
        The created UserInteraction instance
    """
    if not user or not user.is_authenticated:
        return None

    rating = INTERACTION_RATINGS.get(interaction_type, 1.0)

    return UserInteraction.objects.create(
        user=user,
        blog=blog,
        interaction_type=interaction_type,
        rating=rating
    )
