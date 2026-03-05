using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class UpdateBoardGameCollectionHandler(IGameRepository r) : IRequestHandler<UpdateBoardGameCollectionCommand, bool>
{ public Task<bool> Handle(UpdateBoardGameCollectionCommand req, CancellationToken ct) => r.UpdateBoardGameCollectionAsync(req.Collection); }
