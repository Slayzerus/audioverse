using AudioVerse.Domain.Entities.Editor;
using MediatR;

namespace AudioVerse.Application.Queries.Editor
{
    public class GetInputPresetsQuery : IRequest<IEnumerable<AudioInputPreset>>
    {
        public int Skip { get; }
        public int Take { get; }
        public string? Search { get; }

        public GetInputPresetsQuery(int skip, int take, string? search = null)
        {
            Skip = skip;
            Take = take;
            Search = search;
        }
    }
}
