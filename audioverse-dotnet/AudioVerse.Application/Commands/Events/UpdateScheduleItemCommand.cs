using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record UpdateScheduleItemCommand(EventScheduleItem Item) : IRequest<bool>;
}
