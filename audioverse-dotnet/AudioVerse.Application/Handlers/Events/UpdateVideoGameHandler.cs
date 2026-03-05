using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateVideoGameHandler(IEventRepository r) : IRequestHandler<UpdateVideoGameCommand, bool>
{ public Task<bool> Handle(UpdateVideoGameCommand req, CancellationToken ct) => r.UpdateVideoGameAsync(req.Game); }
