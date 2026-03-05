using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddVideoGameHandler(IEventRepository r) : IRequestHandler<AddVideoGameCommand, int>
{ public Task<int> Handle(AddVideoGameCommand req, CancellationToken ct) => r.AddVideoGameAsync(req.Game); }
