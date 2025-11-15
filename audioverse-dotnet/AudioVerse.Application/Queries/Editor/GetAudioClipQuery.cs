using AudioVerse.Domain.Entities.Editor;
using MediatR;

namespace AudioVerse.Application.Queries.Editor
{
    public class GetAudioClipQuery : IRequest<AudioClip?>
    {
        public int ClipId { get; set; }

        public GetAudioClipQuery(int clipId)
        {
            ClipId = clipId;
        }
    }
}
