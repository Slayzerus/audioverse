using MediatR;

namespace AudioVerse.Application.Commands.Audio
{
    public record DeleteGenreCommand(int Id) : IRequest<bool>;
}
