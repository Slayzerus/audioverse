using System.ServiceModel.Syndication;
using System.Xml;
using AudioVerse.Domain.Entities.News;
using AudioVerse.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.BackgroundJobs;

/// <summary>
/// Background worker pobierający artykuły z feedów RSS/Atom wg harmonogramu.
/// </summary>
public class RssFetcherBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RssFetcherBackgroundService> _logger;
    private readonly IHttpClientFactory _httpFactory;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5);

    public RssFetcherBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<RssFetcherBackgroundService> logger,
        IHttpClientFactory httpFactory)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _httpFactory = httpFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("RSS Fetcher starting");
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await FetchDueFeedsAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "RSS Fetcher iteration failed"); }
            await Task.Delay(_checkInterval, stoppingToken);
        }
        _logger.LogInformation("RSS Fetcher stopping");
    }

    private async Task FetchDueFeedsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var repo = scope.ServiceProvider.GetRequiredService<INewsFeedRepository>();
        var feeds = await repo.GetFeedsDueForRefreshAsync();

        foreach (var feed in feeds)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                var articles = await FetchFeedAsync(feed, ct);
                var newArticles = new List<NewsArticle>();
                foreach (var a in articles)
                {
                    if (!await repo.ArticleExistsAsync(feed.Id, a.ExternalId))
                        newArticles.Add(a);
                }
                if (newArticles.Count > 0)
                {
                    await repo.AddArticlesAsync(newArticles);
                    _logger.LogInformation("Feed '{Title}': dodano {Count} nowych artykułów", feed.Title, newArticles.Count);
                }
                await repo.UpdateFeedStatusAsync(feed.Id, DateTime.UtcNow, null);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch feed '{Title}' ({Url})", feed.Title, feed.FeedUrl);
                await repo.UpdateFeedStatusAsync(feed.Id, DateTime.UtcNow, ex.Message);
            }
        }
    }

    private async Task<List<NewsArticle>> FetchFeedAsync(NewsFeed feed, CancellationToken ct)
    {
        using var handler = new HttpClientHandler { AllowAutoRedirect = true, MaxAutomaticRedirections = 5 };
        using var client = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(30) };
        client.DefaultRequestHeaders.UserAgent.ParseAdd("AudioVerse/1.0 (RSS Fetcher)");
        using var response = await client.GetAsync(feed.FeedUrl, ct);
        response.EnsureSuccessStatusCode();
        using var stream = await response.Content.ReadAsStreamAsync(ct);
        var settings = new XmlReaderSettings
        {
            DtdProcessing = DtdProcessing.Ignore,
            MaxCharactersFromEntities = 1024
        };
        using var reader = XmlReader.Create(stream, settings);
        var syndicationFeed = SyndicationFeed.Load(reader);

        var articles = new List<NewsArticle>();
        foreach (var item in syndicationFeed.Items)
        {
            var externalId = item.Id ?? item.Links.FirstOrDefault()?.Uri.ToString() ?? Guid.NewGuid().ToString();
            articles.Add(new NewsArticle
            {
                FeedId = feed.Id,
                ExternalId = externalId,
                Title = item.Title?.Text ?? string.Empty,
                Summary = item.Summary?.Text,
                ContentHtml = (item.Content as TextSyndicationContent)?.Text,
                Url = item.Links.FirstOrDefault()?.Uri.ToString() ?? string.Empty,
                ImageUrl = ExtractImageUrl(item),
                Author = item.Authors.FirstOrDefault()?.Name,
                PublishedAt = item.PublishDate != default ? item.PublishDate.UtcDateTime : DateTime.UtcNow,
                FetchedAt = DateTime.UtcNow
            });
        }
        return articles;
    }

    private static string? ExtractImageUrl(SyndicationItem item)
    {
        var mediaExt = item.ElementExtensions.FirstOrDefault(e => e.OuterName is "thumbnail" or "content");
        if (mediaExt != null)
        {
            try { return mediaExt.GetObject<System.Xml.Linq.XElement>().Attribute("url")?.Value; }
            catch { }
        }
        var enclosure = item.Links.FirstOrDefault(l => l.RelationshipType == "enclosure" && l.MediaType?.StartsWith("image") == true);
        return enclosure?.Uri.ToString();
    }
}
