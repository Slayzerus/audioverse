using MediatR;

namespace AudioVerse.Application.Commands.News;

/// <summary>Toggle a news category (IsActive).</summary>
public record ToggleNewsCategoryCommand(int CategoryId) : IRequest<bool?>;
