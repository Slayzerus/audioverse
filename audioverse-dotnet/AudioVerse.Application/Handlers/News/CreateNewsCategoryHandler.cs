using AudioVerse.Application.Commands.News;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.News;

/// <summary>Handles creating a news category.</summary>
public class CreateNewsCategoryHandler(INewsFeedRepository r) : IRequestHandler<CreateNewsCategoryCommand, int>
{ public async Task<int> Handle(CreateNewsCategoryCommand req, CancellationToken ct) => await r.CreateCategoryAsync(req.Category); }
