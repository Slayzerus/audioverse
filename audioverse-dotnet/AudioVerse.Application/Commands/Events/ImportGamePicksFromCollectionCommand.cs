using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record ImportGamePicksFromCollectionCommand(int EventId, int CollectionId, bool BoardGames) : IRequest<int>;
