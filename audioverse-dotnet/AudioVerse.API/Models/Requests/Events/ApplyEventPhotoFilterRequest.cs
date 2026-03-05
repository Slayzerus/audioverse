namespace AudioVerse.API.Models.Requests.Events;

public class ApplyEventPhotoFilterRequest
{
    public string[] Filters { get; set; } = [];
    public int? UserId { get; set; }
}
