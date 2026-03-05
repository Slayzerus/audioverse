using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Commands.Audio
{
    public record CreateGenreCommand(MusicGenre Genre) : IRequest<int>;
}
