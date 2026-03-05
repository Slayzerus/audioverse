using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to add a menu item.</summary>
public record MenuItemRequest(string Name, string? Description, string? Category,
    decimal? Price, string? Currency, string? ImageUrl, string? Allergens,
    bool IsVegetarian = false, bool IsVegan = false, bool IsGlutenFree = false,
    int SortOrder = 0, bool IsAvailable = true);
