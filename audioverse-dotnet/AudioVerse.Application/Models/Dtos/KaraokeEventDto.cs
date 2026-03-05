using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Application.Models.Dtos
{
    public class KaraokeEventDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Poster { get; set; }
        public string? LocationName { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Access { get; set; } = string.Empty;
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int? OrganizerId { get; set; }
        public int? MaxParticipants { get; set; }

        /// <summary>
        /// Tab visibility overrides configured by the organizer.
        /// Empty list means no overrides – frontend falls back to defaults.
        /// </summary>
        public List<EventTab> Tabs { get; set; } = new();

        public static KaraokeEventDto FromDomain(Event ev) => new()
        {
            Id = ev.Id,
            Title = ev.Title,
            Description = ev.Description,
            Poster = ev.Poster,
            LocationName = ev.LocationName,
            Status = ev.Status.ToString(),
            Access = ev.Access.ToString(),
            StartTime = ev.StartTime,
            EndTime = ev.EndTime,
            OrganizerId = ev.OrganizerId,
            MaxParticipants = ev.MaxParticipants,
            Tabs = ev.Tabs?.ToList() ?? new List<EventTab>(),
        };
    }
}
