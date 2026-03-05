using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteSongPickHandler(IEventRepository r) : IRequestHandler<DeleteSongPickCommand, bool>
{ public Task<bool> Handle(DeleteSongPickCommand req, CancellationToken ct) => r.DeleteSongPickAsync(req.Id); }
