using MediatR;

namespace AudioVerse.Application.Commands.News;

/// <summary>Toggle an RSS feed (IsActive).</summary>
public record ToggleNewsFeedCommand(int FeedId) : IRequest<bool?>;
