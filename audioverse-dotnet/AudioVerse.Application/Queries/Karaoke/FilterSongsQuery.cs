using MediatR;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record FilterSongsQuery(string? Title, string? Artist, string? Genre, string? Language, int? Year)
        : IRequest<IEnumerable<KaraokeSongFile>>;
}
