namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>
/// Gift registry detail DTO (public, for guests).
/// </summary>
public record GiftRegistryDetailDto(int Id, string Name, string? Description, int? EventId, IEnumerable<GiftRegistryItemDto> Items);
