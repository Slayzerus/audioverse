using AudioVerse.Domain.Enums;

namespace AudioVerse.Application.Models.Requests.User
{
    public class CreateMicrophoneRequest
    {
        public string DeviceId { get; set; } = string.Empty;
        public int Volume { get; set; } = 100;
        public int Threshold { get; set; } = 0;
        public bool Visible { get; set; } = true;
        // New microphone configuration
        public int MicGain { get; set; } = 12;
    public int OffsetMs { get; set; } = 0;
        public bool MonitorEnabled { get; set; } = false;
        public int MonitorVolume { get; set; } = 100;
        public double PitchThreshold { get; set; } = 0.5;
        public int SmoothingWindow { get; set; } = 5;
        public int HysteresisFrames { get; set; } = 3;
        public double RmsThreshold { get; set; } = 0.01;
        public bool UseHanning { get; set; } = true;

        public PitchDetectionMethod PitchDetectionMethod { get; set; } = PitchDetectionMethod.UltrastarWP;
    }
}
