using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.UserProfiles
{
    /// <summary>
    /// Połączenie dwóch graczy z różnych profili — ta sama osoba fizyczna.
    /// Synchronizuje dane w ramach zdefiniowanego zakresu (Progress, Appearance, KaraokeSettings).
    /// </summary>
    public class PlayerLink
    {
        public int Id { get; set; }

        /// <summary>Gracz inicjujący połączenie.</summary>
        public int SourcePlayerId { get; set; }
        public UserProfilePlayer? SourcePlayer { get; set; }

        /// <summary>Gracz docelowy (z innego profilu).</summary>
        public int TargetPlayerId { get; set; }
        public UserProfilePlayer? TargetPlayer { get; set; }

        /// <summary>Zakres synchronizacji (flags).</summary>
        public PlayerLinkScope Scope { get; set; } = PlayerLinkScope.Progress;

        /// <summary>Status połączenia.</summary>
        public PlayerLinkStatus Status { get; set; } = PlayerLinkStatus.Active;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RevokedAt { get; set; }
    }
}
