using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke;

public record AddKaraokeSongPickCommand(KaraokeSessionSongPick Pick) : IRequest<int>;
