using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public record UpdateLayerCommand(int Id, string Name, int? AudioClipId) : IRequest<bool>;
}
