using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddMediaCollectionCommand(EventMediaCollection Collection) : IRequest<int>;
