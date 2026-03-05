using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddGamePickCommand(EventSessionGamePick Pick) : IRequest<int>;
