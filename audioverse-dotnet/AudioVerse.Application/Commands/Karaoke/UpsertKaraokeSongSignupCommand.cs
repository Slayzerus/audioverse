using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke;

public record UpsertKaraokeSongSignupCommand(KaraokeSessionSongSignup Signup) : IRequest<int>;
