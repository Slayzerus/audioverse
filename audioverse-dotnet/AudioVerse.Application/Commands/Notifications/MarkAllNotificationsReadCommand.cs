using AudioVerse.Domain.Entities;
using MediatR;

namespace AudioVerse.Application.Commands.Notifications;

public record MarkAllNotificationsReadCommand(int UserId) : IRequest<int>;
