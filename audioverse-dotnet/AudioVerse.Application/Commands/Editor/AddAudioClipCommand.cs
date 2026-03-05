using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class AddAudioClipCommand : IRequest<int>
    {
        public int? UserProfileId { get; set; }
        public string FileName { get; set; }
        public string FileFormat { get; set; }
        public Stream? Data { get; set; }
        public TimeSpan Duration { get; set; }
        public long Size { get; set; }

        public AddAudioClipCommand(int? userProfileId, string fileName, string fileFormat, Stream? data, TimeSpan duration, long size)
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
