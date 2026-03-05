using AudioVerse.Application.Commands.Notifications;
using AudioVerse.Application.Queries.Notifications;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Notifications;

public class SendNotificationHandler(INotificationRepository r) : IRequestHandler<SendNotificationCommand, int>
{ public Task<int> Handle(SendNotificationCommand req, CancellationToken ct) => r.AddAsync(req.Notification); }
