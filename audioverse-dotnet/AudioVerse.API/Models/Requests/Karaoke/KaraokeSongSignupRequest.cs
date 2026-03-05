namespace AudioVerse.API.Models.Requests.Karaoke;

public class KaraokeSongSignupRequest
{
    public int PlayerId { get; set; }
    public int? PreferredSlot { get; set; }
}
