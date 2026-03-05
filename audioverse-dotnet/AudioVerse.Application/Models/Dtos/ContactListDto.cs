using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// Kontakt — widok listy (bez pełnych detali).
    /// </summary>
    public class ContactListDto
    {
        public int Id { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public string DisplayNamePrivate { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Company { get; set; }
        public string? AvatarUrl { get; set; }
        public bool IsFavorite { get; set; }
        public bool IsOrganization { get; set; }
        public int? LinkedUserId { get; set; }
        public int? OrganizationId { get; set; }
        public string? PrimaryEmail { get; set; }
        public string? PrimaryPhone { get; set; }
        public ContactImportSource ImportSource { get; set; }
    }
}
