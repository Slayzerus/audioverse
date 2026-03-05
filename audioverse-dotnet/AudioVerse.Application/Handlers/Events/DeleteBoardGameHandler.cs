using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Games;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteBoardGameHandler(IEventRepository r) : IRequestHandler<DeleteBoardGameCommand, bool>
{ public Task<bool> Handle(DeleteBoardGameCommand req, CancellationToken ct) => r.DeleteBoardGameAsync(req.Id); }
