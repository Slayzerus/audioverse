using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Wejściowy e-mail (do create/update).
    /// </summary>
    public class ContactEmailInput
    {
        public string Email { get; set; } = string.Empty;
        public ContactEmailType Type { get; set; } = ContactEmailType.Personal;
        public bool IsPrimary { get; set; }
    }
}
