using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddBoardGameHandler(IEventRepository r) : IRequestHandler<AddBoardGameCommand, int>
{ public Task<int> Handle(AddBoardGameCommand req, CancellationToken ct) => r.AddBoardGameAsync(req.Game); }
