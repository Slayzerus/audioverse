namespace AudioVerse.Domain.Entities.Games
{
    public class BoardGameCollectionBoardGame
    {
        public int Id { get; set; }
        public int CollectionId { get; set; }
        public BoardGameCollection? Collection { get; set; }
        public int BoardGameId { get; set; }
        public BoardGame? BoardGame { get; set; }
        public int Copies { get; set; } = 1;
    }
}
