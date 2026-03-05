using AudioVerse.Domain.Enums.Events;

namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to create a new event list.</summary>
public record CreateEventListRequest(
    string Name,
    string? Description = null,
    EventListType Type = EventListType.Custom,
    EventListVisibility Visibility = EventListVisibility.Private,
    int? OrganizationId = null,
    int? LeagueId = null,
    string? IconKey = null,
    string? Color = null);
