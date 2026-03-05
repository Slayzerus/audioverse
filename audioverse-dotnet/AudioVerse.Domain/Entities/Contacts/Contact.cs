using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Contacts
{
    /// <summary>
    /// Kontakt w książce adresowej. Może reprezentować:
    /// - osobę niezarejestrowaną (standalone),
    /// - użytkownika systemu (LinkedUserId),
    /// - osobę w organizacji (OrganizationId),
    /// - samą organizację (IsOrganization = true).
    /// </summary>
    public class Contact
    {
        public int Id { get; set; }

        /// <summary>Właściciel kontaktu (kto go stworzył / ma w książce).</summary>
        public int OwnerUserId { get; set; }
        public UserProfile? OwnerUser { get; set; }

        /// <summary>Powiązany użytkownik systemu (opcjonalnie).</summary>
        public int? LinkedUserId { get; set; }
        public UserProfile? LinkedUser { get; set; }

        /// <summary>Powiązana organizacja.</summary>
        public int? OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        /// <summary>Czy kontakt reprezentuje organizację/firmę (a nie osobę).</summary>
        public bool IsOrganization { get; set; }

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        /// <summary>Wyświetlana nazwa (np. "Jan Kowalski" lub "Firma XYZ").</summary>
        public string DisplayName { get; set; } = string.Empty;
        public string DisplayNamePrivate { get; set; } = string.Empty;
        public string? Nickname { get; set; }
        public string? Company { get; set; }
        public string? JobTitle { get; set; }
        public string? Notes { get; set; }
        public string? AvatarUrl { get; set; }

        /// <summary>Źródło importu (Manual, Google, Microsoft, VCard…).</summary>
        public ContactImportSource ImportSource { get; set; } = ContactImportSource.Manual;
        /// <summary>ID z zewnętrznego systemu (do dedup przy ponownym imporcie).</summary>
        public string? ExternalId { get; set; }

        public bool IsFavorite { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public List<ContactEmail> Emails { get; set; } = new();
        public List<ContactPhone> Phones { get; set; } = new();
        public List<ContactAddress> Addresses { get; set; } = new();
        public List<ContactGroupMember> GroupMemberships { get; set; } = new();
    }
}
