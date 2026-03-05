using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Request tworzenia kontaktu — z zagnieżdżonymi e-mailami, telefonami, adresami.
    /// </summary>
    public class ContactCreateRequest
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public string? DisplayNamePrivate { get; set; }
        public string? Nickname { get; set; }
        public string? Company { get; set; }
        public string? JobTitle { get; set; }
        public string? Notes { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsOrganization { get; set; }
        public int? OrganizationId { get; set; }
        public int? LinkedUserId { get; set; }
        public bool IsFavorite { get; set; }
        public ContactImportSource? ImportSource { get; set; }
        public List<ContactEmailInput>? Emails { get; set; }
        public List<ContactPhoneInput>? Phones { get; set; }
        public List<ContactAddressInput>? Addresses { get; set; }
        /// <summary>Opcjonalnie — dodaj kontakt do tych grup od razu.</summary>
        public List<int>? GroupIds { get; set; }
    }
}
