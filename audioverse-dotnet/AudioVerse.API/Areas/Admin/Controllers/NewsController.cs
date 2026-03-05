using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Queries.News;
using AudioVerse.Application.Commands.News;
using AudioVerse.Domain.Entities.News;
using AudioVerse.API.Models.Requests.News;

namespace AudioVerse.API.Areas.Admin.Controllers;

/// <summary>
/// RSS news endpoints — categories, feeds, articles.
/// Read access is public; management requires Admin role.
/// </summary>
[Route("api/news")]
[ApiController]
public class NewsController : ControllerBase
{
    private readonly IMediator _mediator;

    public NewsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ── Publiczne — odczyt ──

    /// <summary>
    /// Get news categories (e.g. Music, Sport, Video Games, Movies).
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _mediator.Send(new GetNewsCategoriesQuery());
        return Ok(categories.Select(c => new { c.Id, c.Name, c.Slug, c.IconUrl, c.SortOrder }));
    }

    /// <summary>
    /// Get articles (paginated). Optionally filter by category or feed.
    /// </summary>
    /// <param name="categoryId">Filter by category (optional).</param>
    /// <param name="feedId">Filter by feed (optional).</param>
    /// <param name="page">Page number (default 1).</param>
    /// <param name="pageSize">Page size (default 20, max 100).</param>
    [HttpGet("articles")]
    public async Task<IActionResult> GetArticles(
        [FromQuery] int? categoryId = null,
        [FromQuery] int? feedId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);
        var (items, total) = await _mediator.Send(new GetNewsArticlesQuery(categoryId, feedId, page, pageSize));
        return Ok(new
        {
            items = items.Select(a => new
            {
                a.Id, a.Title, a.Summary, a.Url, a.ImageUrl, a.Author, a.PublishedAt,
                feedTitle = a.Feed?.Title, feedLogo = a.Feed?.LogoUrl,
                category = a.Feed?.Category?.Name, categorySlug = a.Feed?.Category?.Slug
            }),
            total, page, pageSize,
            totalPages = (int)Math.Ceiling((double)total / pageSize)
        });
    }

    /// <summary>
    /// Get articles by category slug (e.g. /api/news/music, /api/news/sport).
    /// </summary>
    /// <param name="slug">English category slug (e.g. music, sport, video-games).</param>
    /// <param name="page">Page number.</param>
    /// <param name="pageSize">Page size.</param>
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetArticlesByCategory(string slug, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var category = await _mediator.Send(new GetNewsCategoryBySlugQuery(slug));
        if (category == null) return NotFound(new { error = "category_not_found" });
        return await GetArticles(category.Id, null, page, pageSize);
    }

    /// <summary>
    /// Get active RSS feeds.
    /// </summary>
    [HttpGet("feeds")]
    public async Task<IActionResult> GetFeeds()
    {
        var feeds = await _mediator.Send(new GetNewsFeedsQuery());
        return Ok(feeds.Select(f => new
        {
            f.Id, f.Title, f.FeedUrl, f.SiteUrl, f.LogoUrl, f.Language, f.IsActive,
            category = f.Category?.Name, categorySlug = f.Category?.Slug, f.LastFetchedAt
        }));
    }

    // ── Admin — zarządzanie ──

    /// <summary>
    /// Add a new RSS feed (Admin only).
    /// </summary>
    /// <param name="req">Title, feed URL, category, refresh interval.</param>
    [HttpPost("feeds")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateFeed([FromBody] CreateFeedRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.FeedUrl)) return BadRequest("FeedUrl is required");
        if (string.IsNullOrWhiteSpace(req.Title)) return BadRequest("Title is required");
        var feed = new NewsFeed
        {
            Title = req.Title, FeedUrl = req.FeedUrl, SiteUrl = req.SiteUrl, LogoUrl = req.LogoUrl,
            Language = req.Language, CategoryId = req.CategoryId,
            RefreshIntervalMinutes = req.RefreshIntervalMinutes > 0 ? req.RefreshIntervalMinutes : 15,
            IsActive = true
        };
        var id = await _mediator.Send(new CreateNewsFeedCommand(feed));
        return Ok(new { id });
    }

    /// <summary>
    /// Toggle an RSS feed (Admin only). Returns the new IsActive state.
    /// </summary>
    /// <param name="id">Feed ID.</param>
    [HttpPatch("feeds/{id}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleFeed(int id)
    {
        var isActive = await _mediator.Send(new ToggleNewsFeedCommand(id));
        if (isActive == null) return NotFound();
        return Ok(new { id, isActive });
    }

    /// <summary>
    /// Delete an RSS feed (Admin only). Articles are cascade-deleted.
    /// </summary>
    /// <param name="id">Feed ID to delete.</param>
    [HttpDelete("feeds/{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteFeed(int id)
    {
        var ok = await _mediator.Send(new DeleteNewsFeedCommand(id));
        if (!ok) return NotFound();
        return NoContent();
    }

    /// <summary>
    /// Add a new news category (Admin only).
    /// </summary>
    /// <param name="req">Name, slug (English), icon and sort order.</param>
    [HttpPost("categories")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || string.IsNullOrWhiteSpace(req.Slug))
            return BadRequest("Name and Slug are required");
        var category = new NewsFeedCategory { Name = req.Name, Slug = req.Slug, IconUrl = req.IconUrl, SortOrder = req.SortOrder };
        var id = await _mediator.Send(new CreateNewsCategoryCommand(category));
        return Ok(new { id });
    }

    /// <summary>
    /// Toggle a news category (Admin only). Returns the new IsActive state.
    /// </summary>
    /// <param name="id">Category ID.</param>
    [HttpPatch("categories/{id}/toggle")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleCategory(int id)
    {
        var isActive = await _mediator.Send(new ToggleNewsCategoryCommand(id));
        if (isActive == null) return NotFound();
        return Ok(new { id, isActive });
    }

    }
