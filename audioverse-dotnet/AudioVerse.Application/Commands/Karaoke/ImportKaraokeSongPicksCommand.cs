using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using MediatR;

namespace AudioVerse.Application.Commands.Karaoke;

public record ImportKaraokeSongPicksCommand(int SessionId, int PlaylistId) : IRequest<int>;
