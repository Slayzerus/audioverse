namespace AudioVerse.Application.Queries.Vendors;

/// <summary>
/// Single vendor review DTO.
/// </summary>
public record VendorReviewDto(int Id, int UserId, int Rating, string? Comment, int? EventId, DateTime CreatedAtUtc);
