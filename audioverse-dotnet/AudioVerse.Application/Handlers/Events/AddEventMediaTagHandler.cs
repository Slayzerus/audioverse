using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddEventMediaTagHandler(IEventRepository r) : IRequestHandler<AddEventMediaTagCommand, int>
{ public Task<int> Handle(AddEventMediaTagCommand req, CancellationToken ct) => r.AddMediaTagAsync(req.Tag); }
