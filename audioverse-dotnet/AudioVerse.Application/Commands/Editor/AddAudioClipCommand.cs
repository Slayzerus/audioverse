using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class AddAudioClipCommand : IRequest<int>
    {
        public int? UserProfileId { get; set; }
        public string FileName { get; set; }
        public string FileFormat { get; set; }
        public byte[] Data { get; set; }
        public TimeSpan Duration { get; set; }
        public long Size { get; set; }

        public AddAudioClipCommand(int? userProfileId, string fileName, string fileFormat, byte[] data, TimeSpan duration, long size)
        {
            UserProfileId = userProfileId;
            FileName = fileName;
            FileFormat = fileFormat;
            Data = data;
            Duration = duration;
            Size = size;
        }
    }
}
