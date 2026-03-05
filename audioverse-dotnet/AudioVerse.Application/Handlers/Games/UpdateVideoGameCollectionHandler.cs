using AudioVerse.Application.Commands.Games;
using AudioVerse.Application.Queries.Games;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Games;

public class UpdateVideoGameCollectionHandler(IGameRepository r) : IRequestHandler<UpdateVideoGameCollectionCommand, bool>
{ public Task<bool> Handle(UpdateVideoGameCollectionCommand req, CancellationToken ct) => r.UpdateVideoGameCollectionAsync(req.Collection); }
