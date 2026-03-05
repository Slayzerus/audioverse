using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddEventMediaTagCommand(EventMediaTag Tag) : IRequest<int>;
