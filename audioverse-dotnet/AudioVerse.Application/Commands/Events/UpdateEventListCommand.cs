using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpdateEventListCommand(
    int Id,
    string Name,
    string? Description,
    EventListVisibility Visibility,
    string? IconKey,
    string? Color,
    bool IsPinned,
    int SortOrder) : IRequest<bool>;
