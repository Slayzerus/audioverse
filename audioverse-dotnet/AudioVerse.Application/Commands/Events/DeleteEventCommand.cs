using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record DeleteEventCommand(int EventId) : IRequest<bool>;
}
