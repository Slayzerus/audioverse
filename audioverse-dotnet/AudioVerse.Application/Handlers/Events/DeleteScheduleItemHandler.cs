using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteScheduleItemHandler(IEventRepository r) : IRequestHandler<DeleteScheduleItemCommand, bool>
{ public Task<bool> Handle(DeleteScheduleItemCommand req, CancellationToken ct) => r.DeleteScheduleItemAsync(req.Id); }
