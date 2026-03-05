using MediatR;
using AudioVerse.Application.Models.Dtos;

namespace AudioVerse.Application.Queries.Karaoke
{
    public record GetEventDtoQuery(int EventId) : IRequest<KaraokeEventDto?>;
}
