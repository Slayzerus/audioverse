using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class AddSongPickHandler(IEventRepository r) : IRequestHandler<AddSongPickCommand, int>
{ public Task<int> Handle(AddSongPickCommand req, CancellationToken ct) => r.AddSongPickAsync(req.Pick); }
