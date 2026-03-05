using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteSongSignupHandler(IEventRepository r) : IRequestHandler<DeleteSongSignupCommand, bool>
{ public Task<bool> Handle(DeleteSongSignupCommand req, CancellationToken ct) => r.DeleteSongSignupAsync(req.PickId, req.UserId); }
