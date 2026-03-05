using AudioVerse.Domain.Entities.Wishlists;

namespace AudioVerse.API.Models.Requests.Wishlists;

/// <summary>Request to create a new wishlist.</summary>
public record CreateWishlistRequest(string Name, string? Description = null, bool IsPublic = false);
