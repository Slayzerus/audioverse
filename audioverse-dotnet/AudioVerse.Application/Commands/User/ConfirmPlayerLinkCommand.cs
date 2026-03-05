using AudioVerse.Application.Models.Dtos;
using AudioVerse.Domain.Enums;
using MediatR;

namespace AudioVerse.Application.Commands.User
{
    /// <summary>
    /// Potwierdzenie linku gracza z graczem z innego profilu (krok 2 link flow).
    /// </summary>
    public record ConfirmPlayerLinkCommand(int SourcePlayerId, int SourceProfileId, int TargetPlayerId, PlayerLinkScope Scope)
        : IRequest<PlayerLinkDto?>;
}
