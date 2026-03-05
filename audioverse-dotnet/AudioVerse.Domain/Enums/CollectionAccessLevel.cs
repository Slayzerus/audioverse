namespace AudioVerse.Domain.Enums;

/// <summary>
/// Access level for user collections (board games, video games, books, movies, TV shows).
/// </summary>
public enum CollectionAccessLevel
{
    /// <summary>Only the owner can see this collection.</summary>
    Private = 0,

    /// <summary>Anyone with the link can see this collection.</summary>
    Link = 1,

    /// <summary>Visible to friends/followers only.</summary>
    FriendsOnly = 2,

    /// <summary>Publicly visible to everyone.</summary>
    Public = 3
}
