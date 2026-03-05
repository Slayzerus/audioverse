using AudioVerse.Application.Commands.News;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.News;

/// <summary>Handles toggling a news category on/off.</summary>
public class ToggleNewsCategoryHandler(INewsFeedRepository r) : IRequestHandler<ToggleNewsCategoryCommand, bool?>
{
    public async Task<bool?> Handle(ToggleNewsCategoryCommand req, CancellationToken ct)
    {
        var cat = await r.GetCategoryByIdAsync(req.CategoryId);
        if (cat == null) return null;
        cat.IsActive = !cat.IsActive;
        await r.UpdateCategoryAsync(cat);
        return cat.IsActive;
    }
}
