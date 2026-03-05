using AudioVerse.Domain.Enums.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteEventListCommand(int Id) : IRequest<bool>;
