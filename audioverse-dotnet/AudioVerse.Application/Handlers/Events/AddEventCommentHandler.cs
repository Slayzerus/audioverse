using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddEventCommentHandler(IEventRepository r) : IRequestHandler<AddEventCommentCommand, int>
{ public Task<int> Handle(AddEventCommentCommand req, CancellationToken ct) => r.AddCommentAsync(req.Comment); }
