namespace AudioVerse.Application.Models.Requests.Events;

public class EventFilterRequest
{
    public List<int>? OrganizerIds { get; set; }
    public List<AudioVerse.Domain.Enums.Events.EventType>? Types { get; set; }
    public List<AudioVerse.Domain.Enums.EventAccessType>? Accesses { get; set; }
    public List<AudioVerse.Domain.Enums.EventStatus>? Statuses { get; set; }
    public List<AudioVerse.Domain.Enums.Events.EventVisibility>? Visibilities { get; set; }
    public string? Query { get; set; }
    public DateTime? StartFrom { get; set; }
    public DateTime? StartTo { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "StartTime";
    public bool Descending { get; set; } = true;
}
