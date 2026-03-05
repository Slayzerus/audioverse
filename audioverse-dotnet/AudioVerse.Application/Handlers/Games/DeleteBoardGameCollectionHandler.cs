using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteBoardGameCollectionHandler(IGameRepository r) : IRequestHandler<DeleteBoardGameCollectionCommand, bool>
{ public Task<bool> Handle(DeleteBoardGameCollectionCommand req, CancellationToken ct) => r.DeleteBoardGameCollectionAsync(req.Id); }
