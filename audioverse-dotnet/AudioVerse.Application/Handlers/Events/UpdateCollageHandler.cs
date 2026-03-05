using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class UpdateCollageHandler(IEventRepository r) : IRequestHandler<UpdateCollageCommand, bool>
{ public Task<bool> Handle(UpdateCollageCommand req, CancellationToken ct) => r.UpdateCollageAsync(req.Collage); }
