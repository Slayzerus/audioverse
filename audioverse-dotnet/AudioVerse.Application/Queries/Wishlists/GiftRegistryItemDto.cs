namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>
/// Single gift registry item DTO.
/// </summary>
public record GiftRegistryItemDto(int Id, string Name, string? Description, string? ImageUrl, string? ExternalUrl,
    decimal? TargetAmount, string? Currency, int? MaxContributors, bool IsFullyReserved,
    int ContributionCount, decimal TotalContributed, IEnumerable<GiftContributorDto> Contributors);