using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public record DeleteLayerCommand(int Id) : IRequest<bool>;
}
