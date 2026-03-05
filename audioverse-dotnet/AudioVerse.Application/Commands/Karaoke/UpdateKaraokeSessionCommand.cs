using MediatR;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Commands.Karaoke
{
    public record UpdateKaraokeEventCommand(Event Event) : IRequest<bool>;
}
