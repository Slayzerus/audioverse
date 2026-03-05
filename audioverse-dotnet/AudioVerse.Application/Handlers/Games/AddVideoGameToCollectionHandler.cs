using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class AddVideoGameToCollectionHandler(IGameRepository r) : IRequestHandler<AddVideoGameToCollectionCommand, int>
{ public Task<int> Handle(AddVideoGameToCollectionCommand req, CancellationToken ct) => r.AddVideoGameToCollectionAsync(req.Item); }
