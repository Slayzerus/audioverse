using System.Collections.Generic;

namespace AudioVerse.Application.Models.Requests.Karaoke
{
    public class EventFilterRequest
    {
        public List<int>? OrganizerIds { get; set; }
        public List<AudioVerse.Domain.Enums.EventLocationType>? Types { get; set; }
        public List<AudioVerse.Domain.Enums.EventAccessType>? Accesses { get; set; }
        public List<AudioVerse.Domain.Enums.EventStatus>? Statuses { get; set; }
        public string? NameContains { get; set; }
        public DateTime? StartFrom { get; set; }
        public DateTime? StartTo { get; set; }
        public DateTime? EndFrom { get; set; }
        public DateTime? EndTo { get; set; }

        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string? SortBy { get; set; } = "StartTime"; // StartTime, Name, OrganizerId
        public string? SortDir { get; set; } = "desc"; // asc|desc
    }
}
