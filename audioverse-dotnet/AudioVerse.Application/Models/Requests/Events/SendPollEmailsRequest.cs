namespace AudioVerse.API.Areas.Events.Controllers;

public class SendPollEmailsRequest
{
    public List<string> Emails { get; set; } = new();
}
