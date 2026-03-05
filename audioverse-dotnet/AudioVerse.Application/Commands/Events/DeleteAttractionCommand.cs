using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record DeleteAttractionCommand(int Id) : IRequest<bool>;
}
