namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>
/// Gift registry summary DTO (for user's registry list).
/// </summary>
public record GiftRegistrySummaryDto(int Id, string Name, string? Description, int? EventId, string ShareToken, bool IsActive, int ItemCount);
