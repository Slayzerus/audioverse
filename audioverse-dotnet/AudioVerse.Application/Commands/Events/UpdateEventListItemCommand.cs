using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record UpdateEventListItemCommand(int ItemId, string? Note, string? Tags, int SortOrder) : IRequest<bool>;
