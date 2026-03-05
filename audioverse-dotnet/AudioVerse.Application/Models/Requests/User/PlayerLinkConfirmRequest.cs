using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Models.Requests.User
{
    /// <summary>
    /// Request do potwierdzenia linku z wybranym graczem (krok 2 — wybór gracza i zakresu).
    /// </summary>
    public class PlayerLinkConfirmRequest
    {
        /// <summary>ID gracza docelowego (z listy zwróconej w kroku 1).</summary>
        public int TargetPlayerId { get; set; }
        /// <summary>Zakres synchronizacji (flags: Progress=1, Appearance=2, KaraokeSettings=4, All=7).</summary>
        public PlayerLinkScope Scope { get; set; } = PlayerLinkScope.Progress;
    }
}
