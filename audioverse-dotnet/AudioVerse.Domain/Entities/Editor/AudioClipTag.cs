namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioClipTag
    {
        public int AudioClipId { get; set; }
        public string Tag { get; set; } = string.Empty;

        public AudioClipTag()
        {
            
        }

        public AudioClipTag(int audioClipId, string tag)
        {
            AudioClipId = audioClipId;
            Tag = tag;
        }
    }
}
