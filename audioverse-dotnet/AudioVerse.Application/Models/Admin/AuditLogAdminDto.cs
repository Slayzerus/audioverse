using System;

namespace AudioVerse.Application.Models.Admin
{
    public class AuditLogAdminDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime Timestamp { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? DetailsJson { get; set; }
        // Parsed details object - either PermissionChangeDetailDto or BulkPermissionChangeDto
        public AudioVerse.Application.Models.Admin.PermissionChangeDetailDto? Details { get; set; }
        public AudioVerse.Application.Models.Admin.BulkPermissionChangeDto? BulkDetails { get; set; }
    }
}
