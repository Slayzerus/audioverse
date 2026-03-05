namespace AudioVerse.Domain.Entities.Contacts
{
    /// <summary>
    /// Powiązanie kontaktu z grupą (many-to-many).
    /// </summary>
    public class ContactGroupMember
    {
        public int Id { get; set; }
        public int GroupId { get; set; }
        public ContactGroup? Group { get; set; }
        public int ContactId { get; set; }
        public Contact? Contact { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
