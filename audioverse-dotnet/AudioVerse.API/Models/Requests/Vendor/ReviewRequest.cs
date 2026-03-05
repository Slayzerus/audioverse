using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to submit a review.</summary>
public record ReviewRequest(int Rating, string? Comment, int? EventId);
