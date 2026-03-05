using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record DeleteGamePickCommand(int Id) : IRequest<bool>;
