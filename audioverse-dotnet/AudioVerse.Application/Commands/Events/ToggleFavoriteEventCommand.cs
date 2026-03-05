using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record ToggleFavoriteEventCommand(int UserId, int EventId) : IRequest<bool>;
