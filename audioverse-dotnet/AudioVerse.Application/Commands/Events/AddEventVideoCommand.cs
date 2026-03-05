using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record AddEventVideoCommand(EventVideo Video) : IRequest<int>;
