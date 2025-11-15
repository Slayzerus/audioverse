using AudioVerse.Domain.Entities.Editor;
using MediatR;

namespace AudioVerse.Application.Queries.Editor
{
    public class GetAudioClipsQuery : IRequest<IEnumerable<AudioClip>>
    {
        public int Skip { get; set; }
        public int Take { get; set; }
        public string? Tag { get; set; }
        public string? Search { get; set; }

        public GetAudioClipsQuery(int skip, int take, string? tag = null, string? search = null)
        {
            Skip = skip;
            Take = take;
            Tag = tag;
            Search = search;
        }
    }
}
