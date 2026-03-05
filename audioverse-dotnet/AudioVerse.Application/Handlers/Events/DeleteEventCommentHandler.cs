using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteEventCommentHandler(IEventRepository r) : IRequestHandler<DeleteEventCommentCommand, bool>
{ public Task<bool> Handle(DeleteEventCommentCommand req, CancellationToken ct) => r.DeleteCommentAsync(req.Id); }
