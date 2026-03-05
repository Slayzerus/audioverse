namespace AudioVerse.Domain.Entities.Games;

public class VideoGameSessionRoundPartPlayer
{
    public int Id { get; set; }
    public int PartId { get; set; }
    public VideoGameSessionRoundPart? Part { get; set; }
    public int PlayerId { get; set; }
    public int? Score { get; set; }
}
