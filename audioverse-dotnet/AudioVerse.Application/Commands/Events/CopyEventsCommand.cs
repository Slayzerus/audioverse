using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record CopyEventsCommand(int SourceListId, int TargetListId, int[] EventIds, int? AddedByUserId) : IRequest<int>;
