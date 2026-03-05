using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteEventMediaTagHandler(IEventRepository r) : IRequestHandler<DeleteEventMediaTagCommand, bool>
{ public Task<bool> Handle(DeleteEventMediaTagCommand req, CancellationToken ct) => r.DeleteMediaTagAsync(req.Id); }
