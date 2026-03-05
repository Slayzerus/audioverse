namespace AudioVerse.Domain.Entities.Games
{
    public class VideoGameCollectionVideoGame
    {
        public int Id { get; set; }
        public int CollectionId { get; set; }
        public VideoGameCollection? Collection { get; set; }
        public int VideoGameId { get; set; }
        public VideoGame? VideoGame { get; set; }
        public int Copies { get; set; } = 1;
    }
}

