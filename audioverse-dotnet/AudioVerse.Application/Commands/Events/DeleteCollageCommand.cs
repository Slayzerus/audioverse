using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteCollageCommand(int Id) : IRequest<bool>;
