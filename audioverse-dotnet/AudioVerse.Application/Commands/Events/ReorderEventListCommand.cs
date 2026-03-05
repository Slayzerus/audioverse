using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record ReorderEventListCommand(int ListId, Dictionary<int, int> ItemIdToOrder) : IRequest<bool>;
