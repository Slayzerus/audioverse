namespace AudioVerse.Application.Models
{
    public class MicrophoneAssignmentDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string MicrophoneId { get; set; } = string.Empty;
        public string Color { get; set; } = "#FFFFFF";
        public int Slot { get; set; }
        public DateTime AssignedAt { get; set; }
    }
}
