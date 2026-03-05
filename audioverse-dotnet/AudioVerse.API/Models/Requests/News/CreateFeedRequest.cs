

namespace AudioVerse.API.Models.Requests.News;

/// <summary>Request to create an RSS/Atom feed subscription.</summary>
public record CreateFeedRequest(string Title, string FeedUrl, string? SiteUrl, string? LogoUrl, string? Language, int CategoryId, int RefreshIntervalMinutes = 15);
