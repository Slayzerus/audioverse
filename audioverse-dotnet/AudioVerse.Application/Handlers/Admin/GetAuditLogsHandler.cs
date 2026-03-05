using AudioVerse.Application.Models.Admin;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Admin
{
    public class GetAuditLogsHandler : IRequestHandler<GetAuditLogsQuery, List<AuditLogAdminDto>>
    {
        private readonly IAuditRepository _auditRepository;
        
        public GetAuditLogsHandler(IAuditRepository auditRepository)
        {
            _auditRepository = auditRepository;
        }

        public async Task<List<AuditLogAdminDto>> Handle(GetAuditLogsQuery request, CancellationToken cancellationToken)
        {
            var logs = await _auditRepository.GetLogsAsync(
                from: null,
                to: null,
                action: null,
                userId: null,
                page: 1,
                pageSize: request.Take);

            return logs.Select(l => new AuditLogAdminDto
            {
                Id = l.Id,
                UserId = l.UserId,
                Username = l.Username,
                Action = l.Action,
                Description = l.Description,
                Success = l.Success,
                ErrorMessage = l.ErrorMessage,
                Timestamp = l.Timestamp,
                IpAddress = l.IpAddress,
                UserAgent = l.UserAgent
            }).ToList();
        }
    }
}
