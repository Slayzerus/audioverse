namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Free-form tag attached to a book.</summary>
    public class BookTag
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public Book? Book { get; set; }
        public string Tag { get; set; } = string.Empty;
    }
}
