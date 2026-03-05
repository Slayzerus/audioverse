namespace AudioVerse.Application.Models.Requests.Karaoke;

public class AddRoundPlayerRequest
{
    public int PlayerId { get; set; }
    public int Slot { get; set; }
    public string? MicDeviceId { get; set; }
}

