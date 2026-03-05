using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateBoardGameHandler(IEventRepository r) : IRequestHandler<UpdateBoardGameCommand, bool>
{ public Task<bool> Handle(UpdateBoardGameCommand req, CancellationToken ct) => r.UpdateBoardGameAsync(req.Game); }
