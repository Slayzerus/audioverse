using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Adres fizyczny kontaktu.
    /// </summary>
    public class ContactAddressDto
    {
        public int Id { get; set; }
        public ContactAddressType Type { get; set; }
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
