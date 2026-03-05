using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Wejściowy telefon (do create/update).
    /// </summary>
    public class ContactPhoneInput
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public ContactPhoneType Type { get; set; } = ContactPhoneType.Mobile;
        public bool IsPrimary { get; set; }
    }
}
