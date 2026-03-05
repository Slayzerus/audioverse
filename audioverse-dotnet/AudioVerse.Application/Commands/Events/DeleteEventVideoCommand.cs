using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteEventVideoCommand(int Id) : IRequest<bool>;
