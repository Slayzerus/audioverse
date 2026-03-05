using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// E-mail kontaktu.
    /// </summary>
    public class ContactEmailDto
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public ContactEmailType Type { get; set; }
        public bool IsPrimary { get; set; }
    }
}
