using AudioVerse.Domain.Entities.News;
using MediatR;

namespace AudioVerse.Application.Commands.News;

/// <summary>Add a new RSS feed.</summary>
public record CreateNewsFeedCommand(NewsFeed Feed) : IRequest<int>;
