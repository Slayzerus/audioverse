using AudioVerse.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace AudioVerse.Domain.Entities.Audio
{
    /// <summary>
    /// User-created playlist containing ordered song items.
    /// </summary>
    public class Playlist
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public PlaylistAccess Access { get; set; } = PlaylistAccess.Public;
        public string? AccessCode { get; set; }
        public RequestMechanism RequestMechanism { get; set; } = RequestMechanism.None;
        public DateTime Created { get; set; } = DateTime.UtcNow;
        public int? CreatedBy { get; set; }
        public DateTime Modified { get; set; } = DateTime.UtcNow;
        public int? ModifiedBy { get; set; }

        public int? ParentId { get; set; }
        public Playlist? Parent { get; set; }
        public List<Playlist> Children { get; set; } = new();

        public List<PlaylistItem> Items { get; set; } = new();
        public List<PlaylistLink> Links { get; set; } = new();
    }
}