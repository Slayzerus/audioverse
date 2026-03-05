using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.Domain.Entities.Contacts
{
    /// <summary>
    /// Grupa kontaktów (np. "Znajomi", "Rodzina", "Firma XYZ", "Zespół karaoke").
    /// Użytkownik może tworzyć dowolną liczbę grup.
    /// </summary>
    public class ContactGroup
    {
        public int Id { get; set; }

        /// <summary>Właściciel grupy.</summary>
        public int OwnerUserId { get; set; }
        public UserProfile? OwnerUser { get; set; }

        /// <summary>Opcjonalne powiązanie z organizacją.</summary>
        public int? OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        /// <summary>Kolor grupy (hex, do UI).</summary>
        public string? Color { get; set; }
        /// <summary>Ikona grupy (Lucide icon name).</summary>
        public string? Icon { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<ContactGroupMember> Members { get; set; } = new();
    }
}
