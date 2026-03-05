using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record UpdateAttractionCommand(EventAttraction Item) : IRequest<bool>;
}
