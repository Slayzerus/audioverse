using AudioVerse.Application.Commands.Notifications;
using AudioVerse.Application.Queries.Notifications;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Notifications;

public class GetUserNotificationsHandler(INotificationRepository r) : IRequestHandler<GetUserNotificationsQuery, IEnumerable<Notification>>
{ public Task<IEnumerable<Notification>> Handle(GetUserNotificationsQuery req, CancellationToken ct) => r.GetByUserAsync(req.UserId, req.UnreadOnly); }
