using AudioVerse.Domain.Entities;
using MediatR;

namespace AudioVerse.Application.Commands.Notifications;

public record SendNotificationCommand(Notification Notification) : IRequest<int>;
