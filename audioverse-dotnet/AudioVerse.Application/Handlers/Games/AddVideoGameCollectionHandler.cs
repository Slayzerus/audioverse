using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddVideoGameCollectionHandler(IGameRepository r) : IRequestHandler<AddVideoGameCollectionCommand, int>
{ public Task<int> Handle(AddVideoGameCollectionCommand req, CancellationToken ct) => r.AddVideoGameCollectionAsync(req.Collection); }
