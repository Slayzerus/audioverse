using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record SendBulkInvitesCommand(int EventId, int TemplateId, int[] ContactIds, int? UserId) : IRequest<int>;
