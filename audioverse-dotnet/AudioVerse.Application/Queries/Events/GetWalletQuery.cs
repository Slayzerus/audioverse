using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get a user's virtual wallet balance.</summary>
public record GetWalletQuery(int UserId, int? LeagueId = null) : IRequest<VirtualWallet>;
