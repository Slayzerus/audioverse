namespace AudioVerse.Application.Models
{
    public class MicrophoneDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public int Volume { get; set; }
        public int Threshold { get; set; }
        public bool Visible { get; set; }
        public AudioVerse.Domain.Enums.PitchDetectionMethod PitchDetectionMethod { get; set; }
        public int OffsetMs { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
