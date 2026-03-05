using AudioVerse.Application.Commands.Notifications;
using AudioVerse.Application.Queries.Notifications;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Notifications;

public class GetUnreadNotificationCountHandler(INotificationRepository r) : IRequestHandler<GetUnreadNotificationCountQuery, int>
{ public Task<int> Handle(GetUnreadNotificationCountQuery req, CancellationToken ct) => r.GetUnreadCountAsync(req.UserId); }
