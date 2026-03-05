using MediatR;

namespace AudioVerse.Application.Commands.Editor
{
    public record DeleteLayerItemCommand(int Id) : IRequest<bool>;
}
