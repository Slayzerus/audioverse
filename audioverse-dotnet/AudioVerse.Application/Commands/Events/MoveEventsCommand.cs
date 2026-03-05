using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record MoveEventsCommand(int SourceListId, int TargetListId, int[] EventIds) : IRequest<int>;
