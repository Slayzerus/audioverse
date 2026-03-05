namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>
/// Gift contribution DTO (contributor name, amount, message).
/// </summary>
public record GiftContributorDto(int Id, string Name, decimal? Amount, string? Message, bool IsConfirmed);
