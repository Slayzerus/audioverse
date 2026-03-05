using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.UserProfiles
{
    public class UserProfileMicrophone
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string DeviceId { get; set; } = string.Empty;
        public int Volume { get; set; } = 100;
        public int Threshold { get; set; } = 0;
        public bool Visible { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }        
        public UserProfile? User { get; set; }

        // New microphone configuration properties
        // Microphone input gain (0–24)
        public int MicGain { get; set; } = 0;

        // Monitor (local playback) enabled
        public bool MonitorEnabled { get; set; } = false;

        // Monitor output volume (0–200)
        public int MonitorVolume { get; set; } = 0;

        // Pitch detection threshold (0.0–1.0)
        public double PitchThreshold { get; set; } = 0.5;

        // Smoothing window for pitch detection (1–20)
        public int SmoothingWindow { get; set; } = 5;

        // Hysteresis frames for detection (1–20)
        public int HysteresisFrames { get; set; } = 3;

        // RMS threshold for voice activity (0.001–0.1)
        public double RmsThreshold { get; set; } = 0.01;

        // Use Hanning window for smoothing
        public bool UseHanning { get; set; } = true;

        // Pitch detection algorithm to use
        public PitchDetectionMethod PitchDetectionMethod { get; set; } = PitchDetectionMethod.UltrastarWP;
        // Offset in milliseconds to apply to input timing (can be negative)
        public int OffsetMs { get; set; } = 0;
    }
}
