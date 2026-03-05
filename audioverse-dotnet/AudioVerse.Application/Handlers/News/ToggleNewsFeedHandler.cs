using AudioVerse.Application.Commands.News;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.News;

/// <summary>Handles toggling an RSS feed on/off.</summary>
public class ToggleNewsFeedHandler(INewsFeedRepository r) : IRequestHandler<ToggleNewsFeedCommand, bool?>
{
    public async Task<bool?> Handle(ToggleNewsFeedCommand req, CancellationToken ct)
    {
        var feed = await r.GetFeedByIdAsync(req.FeedId);
        if (feed == null) return null;
        feed.IsActive = !feed.IsActive;
        await r.UpdateFeedAsync(feed);
        return feed.IsActive;
    }
}
