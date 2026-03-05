namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Pojedynczy kontakt w batch imporcie.
    /// </summary>
    public class ContactImportItem
    {
        public string? ExternalId { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? DisplayName { get; set; }
        public string? Company { get; set; }
        public string? JobTitle { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsOrganization { get; set; }
        public List<ContactEmailInput>? Emails { get; set; }
        public List<ContactPhoneInput>? Phones { get; set; }
        public List<ContactAddressInput>? Addresses { get; set; }
    }
}
