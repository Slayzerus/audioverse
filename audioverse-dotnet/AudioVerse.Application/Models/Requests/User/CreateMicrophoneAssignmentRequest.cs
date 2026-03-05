namespace AudioVerse.Application.Models.Requests.User
{
    public class CreateMicrophoneAssignmentRequest
    {
        public int UserId { get; set; }
        public string MicrophoneId { get; set; } = string.Empty;
        public string Color { get; set; } = "#FFFFFF";
        public int Slot { get; set; }
    }
}
