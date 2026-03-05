using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddEventsBulkCommand(int ListId, int[] EventIds, int? AddedByUserId) : IRequest<int>;
