using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class DeleteEventPhotoHandler(IEventRepository r) : IRequestHandler<DeleteEventPhotoCommand, bool>
{ public Task<bool> Handle(DeleteEventPhotoCommand req, CancellationToken ct) => r.DeletePhotoAsync(req.Id); }
