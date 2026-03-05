namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Request aktualizacji kontaktu — wszystkie pola opcjonalne (partial update).
    /// Jeśli Emails/Phones/Addresses != null → replace all.
    /// </summary>
    public class ContactUpdateRequest
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
        public bool? IsOrganization { get; set; }
        public int? OrganizationId { get; set; }
        public int? LinkedUserId { get; set; }
        public bool? IsFavorite { get; set; }
        public List<ContactEmailInput>? Emails { get; set; }
        public List<ContactPhoneInput>? Phones { get; set; }
        public List<ContactAddressInput>? Addresses { get; set; }
    }
}
