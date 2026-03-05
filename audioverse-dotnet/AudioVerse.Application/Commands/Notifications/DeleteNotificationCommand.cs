using AudioVerse.Domain.Entities;
using MediatR;

namespace AudioVerse.Application.Commands.Notifications;

public record DeleteNotificationCommand(int Id) : IRequest<bool>;
