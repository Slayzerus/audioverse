namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Many-to-many link between a book collection and a book.</summary>
    public class BookCollectionBook
    {
        public int Id { get; set; }
        public int CollectionId { get; set; }
        public BookCollection? Collection { get; set; }
        public int BookId { get; set; }
        public Book? Book { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
