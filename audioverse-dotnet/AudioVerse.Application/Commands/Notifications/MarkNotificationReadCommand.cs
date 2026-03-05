using AudioVerse.Domain.Entities;
using MediatR;

namespace AudioVerse.Application.Commands.Notifications;

public record MarkNotificationReadCommand(int Id) : IRequest<bool>;
