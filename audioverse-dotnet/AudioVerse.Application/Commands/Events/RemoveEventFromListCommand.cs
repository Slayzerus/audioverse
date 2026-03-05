using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record RemoveEventFromListCommand(int ItemId) : IRequest<bool>;
