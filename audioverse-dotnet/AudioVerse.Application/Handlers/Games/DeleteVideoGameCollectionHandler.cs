using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class DeleteVideoGameCollectionHandler(IGameRepository r) : IRequestHandler<DeleteVideoGameCollectionCommand, bool>
{ public Task<bool> Handle(DeleteVideoGameCollectionCommand req, CancellationToken ct) => r.DeleteVideoGameCollectionAsync(req.Id); }
