using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record RemoveEventsBulkCommand(int ListId, int[] EventIds) : IRequest<int>;
