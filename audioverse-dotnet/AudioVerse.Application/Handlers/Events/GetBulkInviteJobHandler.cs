using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class GetBulkInviteJobHandler(IEventRepository r) : IRequestHandler<GetBulkInviteJobQuery, BulkInviteJob?>
{ public Task<BulkInviteJob?> Handle(GetBulkInviteJobQuery req, CancellationToken ct) => r.GetBulkInviteJobByIdAsync(req.JobId); }
