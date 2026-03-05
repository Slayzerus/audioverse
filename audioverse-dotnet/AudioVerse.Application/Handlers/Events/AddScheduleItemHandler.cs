using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddScheduleItemHandler(IEventRepository r) : IRequestHandler<AddScheduleItemCommand, int>
{ public Task<int> Handle(AddScheduleItemCommand req, CancellationToken ct) => r.AddScheduleItemAsync(req.Item); }
