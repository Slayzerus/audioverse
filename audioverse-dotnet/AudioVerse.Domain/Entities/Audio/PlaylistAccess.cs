namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>
    /// Playlist visibility/access level (Private, Public, SharedLink).
    /// </summary>
    public enum PlaylistAccess
    {
        Public = 0,
        Unlisted = 1,
        Private = 2
    }
}
