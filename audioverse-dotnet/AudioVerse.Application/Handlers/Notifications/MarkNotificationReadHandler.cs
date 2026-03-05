using AudioVerse.Application.Commands.Notifications;
using AudioVerse.Application.Queries.Notifications;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Notifications;

public class MarkNotificationReadHandler(INotificationRepository r) : IRequestHandler<MarkNotificationReadCommand, bool>
{ public Task<bool> Handle(MarkNotificationReadCommand req, CancellationToken ct) => r.MarkAsReadAsync(req.Id); }
