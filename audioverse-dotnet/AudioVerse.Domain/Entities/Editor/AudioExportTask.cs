using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Editor
{
    public class AudioExportTask
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public int? RequestedByUserId { get; set; }
        public ExportStatus Status { get; set; } = ExportStatus.Pending;
        public string? OutputObjectKey { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}
