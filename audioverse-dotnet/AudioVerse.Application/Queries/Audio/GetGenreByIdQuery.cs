using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Queries.Audio
{
    public record GetGenreByIdQuery(int Id) : IRequest<MusicGenre?>;
}
