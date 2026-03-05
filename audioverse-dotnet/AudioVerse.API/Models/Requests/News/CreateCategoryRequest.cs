

namespace AudioVerse.API.Models.Requests.News;

/// <summary>Request to create a news category.</summary>
public record CreateCategoryRequest(string Name, string Slug, string? IconUrl, int SortOrder = 0);
