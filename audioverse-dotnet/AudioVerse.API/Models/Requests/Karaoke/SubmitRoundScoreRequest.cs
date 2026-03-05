namespace AudioVerse.API.Models.Requests.Karaoke;

public record SubmitRoundScoreRequest(int Score, int? SingingId = null);
