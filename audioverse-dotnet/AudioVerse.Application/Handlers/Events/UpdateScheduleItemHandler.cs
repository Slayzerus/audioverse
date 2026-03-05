using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateScheduleItemHandler(IEventRepository r) : IRequestHandler<UpdateScheduleItemCommand, bool>
{ public Task<bool> Handle(UpdateScheduleItemCommand req, CancellationToken ct) => r.UpdateScheduleItemAsync(req.Item); }
