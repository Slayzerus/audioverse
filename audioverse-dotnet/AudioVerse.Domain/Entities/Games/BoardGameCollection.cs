using System;
using System.Collections.Generic;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Games
{
    public class BoardGameCollection
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
        public BoardGameCollection? Parent { get; set; }
        public List<BoardGameCollection> Children { get; set; } = new();

        public ICollection<BoardGameCollectionBoardGame> Items { get; set; } = new List<BoardGameCollectionBoardGame>();
    }
}
