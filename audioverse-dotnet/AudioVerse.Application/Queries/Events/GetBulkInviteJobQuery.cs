using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetBulkInviteJobQuery(int JobId) : IRequest<BulkInviteJob?>;
