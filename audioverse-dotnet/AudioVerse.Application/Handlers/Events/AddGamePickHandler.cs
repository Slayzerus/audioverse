using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddGamePickHandler(IEventRepository r) : IRequestHandler<AddGamePickCommand, int>
{ public Task<int> Handle(AddGamePickCommand req, CancellationToken ct) => r.AddGamePickAsync(req.Pick); }
