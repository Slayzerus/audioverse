namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioInputMapping
    {
        public int Id { get; set; }
        public int? UserProfileId { get; set; } 
        public int? LayerId { get; set; }
        public int? SectionId { get; set; }
        public string ActionName { get; set; } = string.Empty; //Pad1, StartRecording, EndRecording, ToggleRecording
        public string DeviceType { get; set; } = string.Empty; //Keyboard, Controller, Microphone, etc.
        public string DeviceId { get; set; } = string.Empty;
        public string InputKey { get; set; } = string.Empty; //E, RT, START

        public AudioInputMapping()
        {
            
        }

        public AudioInputMapping(int id, string actionName, string deviceType, string deviceId, int? userProfileId = null)
        {
            Id = id;
            ActionName = actionName;
            DeviceType = deviceType;
            DeviceId = deviceId;
            UserProfileId = userProfileId;
        }
    }
}
