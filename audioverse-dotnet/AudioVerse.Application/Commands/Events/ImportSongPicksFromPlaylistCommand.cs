using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

public record ImportSongPicksFromPlaylistCommand(int EventId, int SessionId, int PlaylistId) : IRequest<int>;
