using MediatR;

namespace AudioVerse.Application.Commands.Events
{
    public record DeleteScheduleItemCommand(int Id) : IRequest<bool>;
}
