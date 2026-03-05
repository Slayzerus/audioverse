using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddEventVideoHandler(IEventRepository r) : IRequestHandler<AddEventVideoCommand, int>
{ public Task<int> Handle(AddEventVideoCommand req, CancellationToken ct) => r.AddVideoAsync(req.Video); }
