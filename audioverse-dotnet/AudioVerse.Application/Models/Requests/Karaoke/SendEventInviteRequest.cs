namespace AudioVerse.Application.Models.Requests.Karaoke
{
    public class SendEventInviteRequest
    {
        public int? ToUserId { get; set; }
        public string? ToEmail { get; set; }
        public string? Message { get; set; }
    }
}
