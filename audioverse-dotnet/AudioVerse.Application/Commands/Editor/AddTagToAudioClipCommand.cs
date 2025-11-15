using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class AddTagToAudioClipCommand : IRequest<bool>
    {
        public int ClipId { get; set; }
        public string Tag { get; set; }

        public AddTagToAudioClipCommand(int clipId, string tag)
        {
            ClipId = clipId;
            Tag = tag;
        }
    }
}
