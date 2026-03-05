using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public record DeleteAudioClipCommand(int Id) : IRequest<bool>;
}
