using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteMediaCollectionCommand(int Id) : IRequest<bool>;
