using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Wejściowy adres fizyczny (do create/update).
    /// </summary>
    public class ContactAddressInput
    {
        public ContactAddressType Type { get; set; } = ContactAddressType.Home;
        public string? Label { get; set; }
        public string Street { get; set; } = string.Empty;
        public string? Street2 { get; set; }
        public string City { get; set; } = string.Empty;
        public string? State { get; set; }
        public string PostalCode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
    }
}
