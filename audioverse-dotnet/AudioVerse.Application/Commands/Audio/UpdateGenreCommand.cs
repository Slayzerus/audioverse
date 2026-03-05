using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio
{
    public record UpdateGenreCommand(MusicGenre Genre) : IRequest<bool>;
}
