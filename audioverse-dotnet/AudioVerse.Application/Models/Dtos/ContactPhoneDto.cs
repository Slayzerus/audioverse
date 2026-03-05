using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Telefon kontaktu.
    /// </summary>
    public class ContactPhoneDto
    {
        public int Id { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public ContactPhoneType Type { get; set; }
        public bool IsPrimary { get; set; }
    }
}
