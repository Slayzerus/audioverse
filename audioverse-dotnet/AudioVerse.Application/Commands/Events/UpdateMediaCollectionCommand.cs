using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpdateMediaCollectionCommand(EventMediaCollection Collection) : IRequest<bool>;
