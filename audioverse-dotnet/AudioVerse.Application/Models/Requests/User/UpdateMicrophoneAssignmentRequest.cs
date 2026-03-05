namespace AudioVerse.Application.Models.Requests.User
{
    public class UpdateMicrophoneAssignmentRequest
    {
        public string Color { get; set; } = "#FFFFFF";
        public int Slot { get; set; }
    }
}
