namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request to move events between lists.</summary>
public record MoveEventsRequest(int SourceListId, int TargetListId, int[] EventIds);
