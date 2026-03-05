using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Media
{
    /// <summary>User-curated collection of movies (watchlist, favorites, etc.).</summary>
    public class MovieCollection
    {
        public int Id { get; set; }
        public int OwnerId { get; set; }
        public UserProfile? Owner { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPublic { get; set; } = false;
        public bool IsWishlist { get; set; } = false;
        public CollectionAccessLevel AccessLevel { get; set; } = CollectionAccessLevel.Private;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? ParentId { get; set; }
        public MovieCollection? Parent { get; set; }
        public List<MovieCollection> Children { get; set; } = new();

        public ICollection<MovieCollectionMovie> Items { get; set; } = new List<MovieCollectionMovie>();
    }
}
