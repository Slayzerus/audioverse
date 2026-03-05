using AudioVerse.Application.Models.Dtos;
using MediatR;

namespace AudioVerse.Application.Queries.User
{
    /// <summary>
    /// Pobranie listy linków gracza (incoming + outgoing).
    /// </summary>
    public record GetPlayerLinksQuery(int PlayerId, int ProfileId) : IRequest<List<PlayerLinkDto>>;
}
