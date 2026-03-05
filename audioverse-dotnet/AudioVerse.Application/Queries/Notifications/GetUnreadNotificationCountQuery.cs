using AudioVerse.Domain.Entities;
using MediatR;

namespace AudioVerse.Application.Queries.Notifications;

public record GetUnreadNotificationCountQuery(int UserId) : IRequest<int>;
