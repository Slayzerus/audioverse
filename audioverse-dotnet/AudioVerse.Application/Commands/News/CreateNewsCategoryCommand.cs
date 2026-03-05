using AudioVerse.Domain.Entities.News;
using MediatR;

namespace AudioVerse.Application.Commands.News;

/// <summary>Add a new news category.</summary>
public record CreateNewsCategoryCommand(NewsFeedCategory Category) : IRequest<int>;
