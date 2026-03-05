using MediatR;

namespace AudioVerse.Application.Commands.News;

/// <summary>Delete an RSS feed.</summary>
public record DeleteNewsFeedCommand(int FeedId) : IRequest<bool>;
