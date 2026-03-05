namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>Book entry in the catalog (book club, reading list).</summary>
    public class Book
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Author { get; set; }
        public string? Description { get; set; }
        public string? Isbn { get; set; }
        public int? PageCount { get; set; }
        public int? PublishedYear { get; set; }
        public string? Publisher { get; set; }
        public string? CoverUrl { get; set; }
        public string? Genre { get; set; }
        public double? Rating { get; set; }
        public string? Language { get; set; }

        public int? OwnerId { get; set; }
        public UserProfiles.UserProfile? Owner { get; set; }

        // External catalog IDs
        public string? OpenLibraryId { get; set; }
        public string? GoogleBooksId { get; set; }
        public string? ImportedFrom { get; set; }
        public DateTime? GoogleBooksLastSyncUtc { get; set; }

        public int? BookGenreId { get; set; }
        public BookGenre? BookGenre { get; set; }

        public List<BookTag> Tags { get; set; } = new();
    }
}
