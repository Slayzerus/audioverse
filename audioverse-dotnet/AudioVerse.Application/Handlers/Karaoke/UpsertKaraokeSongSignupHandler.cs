using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class UpsertKaraokeSongSignupHandler(IKaraokeSongPickRepository r) : IRequestHandler<UpsertKaraokeSongSignupCommand, int>
{ public Task<int> Handle(UpsertKaraokeSongSignupCommand req, CancellationToken ct) => r.UpsertKaraokeSongSignupAsync(req.Signup); }
