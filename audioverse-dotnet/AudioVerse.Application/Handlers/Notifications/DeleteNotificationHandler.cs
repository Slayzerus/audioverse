using AudioVerse.Application.Commands.Notifications;
using AudioVerse.Application.Queries.Notifications;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Notifications;

public class DeleteNotificationHandler(INotificationRepository r) : IRequestHandler<DeleteNotificationCommand, bool>
{ public Task<bool> Handle(DeleteNotificationCommand req, CancellationToken ct) => r.DeleteAsync(req.Id); }
