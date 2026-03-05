using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Place a bet on a betting option (deducts from virtual wallet).</summary>
public record PlaceBetCommand(int MarketId, int OptionId, int UserId, decimal Amount, int? LeagueId = null) : IRequest<int>;
