using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Contacts
{
    /// <summary>
    /// Adres e-mail kontaktu. Kontakt może mieć wiele adresów e-mail.
    /// </summary>
    public class ContactEmail
    {
        public int Id { get; set; }
        public int ContactId { get; set; }
        public Contact? Contact { get; set; }

        public string Email { get; set; } = string.Empty;
        public ContactEmailType Type { get; set; } = ContactEmailType.Personal;
        public bool IsPrimary { get; set; }
    }
}
