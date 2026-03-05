using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Kontakt — pełne szczegóły z e-mailami, telefonami, adresami i grupami.
    /// </summary>
    public class ContactDetailDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string DisplayNamePrivate { get; set; } = string.Empty;
        public string? Nickname { get; set; }
        public string? Company { get; set; }
        public string? JobTitle { get; set; }
        public string? Notes { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsOrganization { get; set; }
        public bool IsFavorite { get; set; }
        public int? LinkedUserId { get; set; }
        public int? OrganizationId { get; set; }
        public ContactImportSource ImportSource { get; set; }
        public string? ExternalId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<ContactEmailDto> Emails { get; set; } = [];
        public List<ContactPhoneDto> Phones { get; set; } = [];
        public List<ContactAddressDto> Addresses { get; set; } = [];
        public List<ContactGroupRefDto> Groups { get; set; } = [];
    }
}
