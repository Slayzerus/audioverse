using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Queries.Audio;

public record GetSoundfontsQuery(int Page = 1, int PageSize = 20, string? Query = null, SoundfontFormat? Format = null) : IRequest<IEnumerable<Soundfont>>;
