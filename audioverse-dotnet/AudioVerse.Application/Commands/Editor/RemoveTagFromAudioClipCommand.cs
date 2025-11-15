using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public class RemoveTagFromAudioClipCommand : IRequest<bool>
    {
        public int ClipId { get; set; }
        public string Tag { get; set; }

        public RemoveTagFromAudioClipCommand(int clipId, string tag)
        {
            ClipId = clipId;
            Tag = tag;
        }
    }
}
