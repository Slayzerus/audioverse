namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Sugestia użytkownika do zlinkowania z kontaktem.
    /// </summary>
    public class ContactUserSuggestionDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
    }
}
