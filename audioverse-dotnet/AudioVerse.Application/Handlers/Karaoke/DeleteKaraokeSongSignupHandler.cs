using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class DeleteKaraokeSongSignupHandler(IKaraokeSongPickRepository r) : IRequestHandler<DeleteKaraokeSongSignupCommand, bool>
{ public Task<bool> Handle(DeleteKaraokeSongSignupCommand req, CancellationToken ct) => r.DeleteKaraokeSongSignupAsync(req.PickId, req.PlayerId); }
