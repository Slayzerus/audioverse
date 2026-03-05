using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Application.Models.Requests.User
{
    /// <summary>
    /// Request do tworzenia nowego gracza w profilu użytkownika.
    /// </summary>
    public class CreateUserProfilePlayerRequest
    {
        public string Name { get; set; } = string.Empty;
        public string PreferredColors { get; set; } = string.Empty;
        public string FillPattern { get; set; } = "Pill";
        public bool IsMainPlayer { get; set; } = false;
        public string? Email { get; set; }
        public string? Icon { get; set; }
        public KaraokeSettings? KaraokeSettings { get; set; }
        public Microsoft.AspNetCore.Http.IFormFile? Photo { get; set; }
    }
}
