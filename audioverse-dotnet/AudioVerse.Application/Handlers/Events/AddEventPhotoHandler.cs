using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddEventPhotoHandler(IEventRepository r) : IRequestHandler<AddEventPhotoCommand, int>
{ public Task<int> Handle(AddEventPhotoCommand req, CancellationToken ct) => r.AddPhotoAsync(req.Photo); }
