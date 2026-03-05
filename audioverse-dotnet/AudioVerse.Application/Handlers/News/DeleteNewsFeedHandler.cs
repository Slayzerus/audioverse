using AudioVerse.Application.Commands.News;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.News;

/// <summary>Handles deleting an RSS feed.</summary>
public class DeleteNewsFeedHandler(INewsFeedRepository r) : IRequestHandler<DeleteNewsFeedCommand, bool>
{ public async Task<bool> Handle(DeleteNewsFeedCommand req, CancellationToken ct) => await r.DeleteFeedAsync(req.FeedId); }
