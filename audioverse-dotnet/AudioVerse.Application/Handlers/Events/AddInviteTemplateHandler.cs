using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddInviteTemplateHandler(IEventRepository r) : IRequestHandler<AddInviteTemplateCommand, int>
{ public Task<int> Handle(AddInviteTemplateCommand req, CancellationToken ct) => r.AddInviteTemplateAsync(req.Template); }
