using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class AddKaraokeSongPickHandler(IKaraokeSongPickRepository r) : IRequestHandler<AddKaraokeSongPickCommand, int>
{ public Task<int> Handle(AddKaraokeSongPickCommand req, CancellationToken ct) => r.AddKaraokeSongPickAsync(req.Pick); }
