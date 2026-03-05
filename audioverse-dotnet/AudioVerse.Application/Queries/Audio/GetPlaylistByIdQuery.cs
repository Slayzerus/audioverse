using AudioVerse.Domain.Entities.Audio;
using MediatR;

namespace AudioVerse.Application.Queries.Audio
{
    public record GetPlaylistByIdQuery(int Id, bool IncludeChildren = false, int MaxDepth = 1) : IRequest<Playlist?>;
}
