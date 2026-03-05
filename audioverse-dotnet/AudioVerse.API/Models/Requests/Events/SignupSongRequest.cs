namespace AudioVerse.API.Models.Requests.Events;

public class SignupSongRequest
{
    public int UserId { get; set; }
    public int? PreferredSlot { get; set; }
}
