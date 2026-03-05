using AudioVerse.Application.Commands.Notifications;
using AudioVerse.Application.Queries.Notifications;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Notifications;

public class MarkAllNotificationsReadHandler(INotificationRepository r) : IRequestHandler<MarkAllNotificationsReadCommand, int>
{ public Task<int> Handle(MarkAllNotificationsReadCommand req, CancellationToken ct) => r.MarkAllAsReadAsync(req.UserId); }
