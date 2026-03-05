using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteCollageItemCommand(int Id) : IRequest<bool>;
