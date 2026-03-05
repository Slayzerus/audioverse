namespace AudioVerse.Domain.Entities.Radio
{
    /// <summary>
    /// Reprezentuje stację radiową / kanał z ustaloną playlistą.
    /// </summary>
    public class RadioStation
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Description { get; set; }

        /// <summary>
        /// Maksymalna liczba równoczesnych słuchaczy dla tej stacji.
        /// Null = brak limitu (stosuj globalny limit).
        /// </summary>
        public int? MaxListeners { get; set; }

        /// <summary>
        /// Opcjonalna domyślna playlista (Playlist istnieje w Audio namespace).
        /// </summary>
        public int? DefaultPlaylistId { get; set; }

        public bool IsPublic { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
