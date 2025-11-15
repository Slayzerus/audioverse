using MediatR;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetCoverImageQuery(string FilePath) : IRequest<string>;
}
