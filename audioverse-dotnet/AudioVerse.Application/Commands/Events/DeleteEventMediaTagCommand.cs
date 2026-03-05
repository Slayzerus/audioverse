using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteEventMediaTagCommand(int Id) : IRequest<bool>;
