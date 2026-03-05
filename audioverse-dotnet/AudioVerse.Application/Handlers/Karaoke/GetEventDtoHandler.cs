using AudioVerse.Application.Models.Dtos;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class GetEventDtoHandler(IKaraokeRepository repo) : IRequestHandler<GetEventDtoQuery, KaraokeEventDto?>
{
    public async Task<KaraokeEventDto?> Handle(GetEventDtoQuery req, CancellationToken ct)
    {
        var ev = await repo.GetEventByIdAsync(req.EventId);
        return ev == null ? null : KaraokeEventDto.FromDomain(ev);
    }
}
