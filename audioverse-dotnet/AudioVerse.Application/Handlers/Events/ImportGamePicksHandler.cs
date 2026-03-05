using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class ImportGamePicksHandler(IEventRepository r) : IRequestHandler<ImportGamePicksFromCollectionCommand, int>
{ public Task<int> Handle(ImportGamePicksFromCollectionCommand req, CancellationToken ct) => r.ImportGamePicksFromCollectionAsync(req.EventId, req.CollectionId, req.BoardGames); }
