using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record AddAttractionCommand(EventAttraction Item) : IRequest<int>;
}
