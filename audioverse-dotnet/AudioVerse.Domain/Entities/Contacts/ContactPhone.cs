using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Contacts
{
    /// <summary>
    /// Numer telefonu kontaktu. Kontakt może mieć wiele numerów.
    /// </summary>
    public class ContactPhone
    {
        public int Id { get; set; }
        public int ContactId { get; set; }
        public Contact? Contact { get; set; }

        public string PhoneNumber { get; set; } = string.Empty;
        public ContactPhoneType Type { get; set; } = ContactPhoneType.Mobile;
        public bool IsPrimary { get; set; }
    }
}
