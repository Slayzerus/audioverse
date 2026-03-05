using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record CreateEventListCommand(
    string Name,
    string? Description,
    EventListType Type,
    EventListVisibility Visibility,
    int? OwnerUserId,
    int? OrganizationId,
    int? LeagueId,
    string? IconKey,
    string? Color) : IRequest<int>;
