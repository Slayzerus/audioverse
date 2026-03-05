using AudioVerse.Application.Commands.News;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.News;

/// <summary>Handles creating an RSS feed.</summary>
public class CreateNewsFeedHandler(INewsFeedRepository r) : IRequestHandler<CreateNewsFeedCommand, int>
{ public async Task<int> Handle(CreateNewsFeedCommand req, CancellationToken ct) => await r.CreateFeedAsync(req.Feed); }
