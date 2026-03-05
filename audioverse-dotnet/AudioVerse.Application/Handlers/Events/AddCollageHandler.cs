using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddCollageHandler(IEventRepository r) : IRequestHandler<AddCollageCommand, int>
{ public Task<int> Handle(AddCollageCommand req, CancellationToken ct) => r.AddCollageAsync(req.Collage); }
