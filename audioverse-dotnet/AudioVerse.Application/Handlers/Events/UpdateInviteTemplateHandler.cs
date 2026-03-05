using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateInviteTemplateHandler(IEventRepository r) : IRequestHandler<UpdateInviteTemplateCommand, bool>
{ public Task<bool> Handle(UpdateInviteTemplateCommand req, CancellationToken ct) => r.UpdateInviteTemplateAsync(req.Template); }
