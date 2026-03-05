using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class DeleteKaraokeSongPickHandler(IKaraokeSongPickRepository r) : IRequestHandler<DeleteKaraokeSongPickCommand, bool>
{ public Task<bool> Handle(DeleteKaraokeSongPickCommand req, CancellationToken ct) => r.DeleteKaraokeSongPickAsync(req.Id); }
