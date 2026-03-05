namespace AudioVerse.API.Models.Requests.Events;

/// <summary>Request with an array of event IDs for bulk operations.</summary>
public record BulkEventIdsRequest(int[] EventIds);
