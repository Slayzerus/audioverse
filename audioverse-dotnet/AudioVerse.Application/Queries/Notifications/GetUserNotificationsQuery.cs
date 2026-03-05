using AudioVerse.Domain.Entities;
using MediatR;

namespace AudioVerse.Application.Queries.Notifications;

public record GetUserNotificationsQuery(int UserId, bool UnreadOnly = false) : IRequest<IEnumerable<Notification>>;
