namespace AudioVerse.Application.Models.Requests.User
{
    /// <summary>
    /// Request do wyszukania graczy z innego profilu (krok 1 — uwierzytelnienie).
    /// </summary>
    public class PlayerLinkSearchRequest
    {
        /// <summary>Login (username) właściciela docelowego profilu.</summary>
        public string Login { get; set; } = string.Empty;
        /// <summary>Hasło właściciela docelowego profilu.</summary>
        public string Password { get; set; } = string.Empty;
    }
}
