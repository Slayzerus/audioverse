using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddEventToListCommand(int ListId, int EventId, string? Note, string? Tags, int? AddedByUserId) : IRequest<int>;
