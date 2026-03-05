

namespace AudioVerse.API.Models.Requests.Radio;

/// <summary>Request to create/update a schedule slot.</summary>
public record ScheduleSlotRequest(string Title, string? Description, DayOfWeek? DayOfWeek, DateTime? SpecificDate, string StartTime, string EndTime, int? PlaylistId, int? InviteId, int? DjUserId, string? DjName, bool IsConfirmed = false, string? Color = null);
