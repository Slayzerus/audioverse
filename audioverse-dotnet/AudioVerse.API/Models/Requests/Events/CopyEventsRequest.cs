namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to copy events between lists.</summary>
public record CopyEventsRequest(int SourceListId, int TargetListId, int[] EventIds);
