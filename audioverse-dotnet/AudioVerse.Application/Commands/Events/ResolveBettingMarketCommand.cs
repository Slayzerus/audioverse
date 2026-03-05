using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Resolve a betting market by selecting the winning option. Pays out winners.</summary>
public record ResolveBettingMarketCommand(int MarketId, int WinningOptionId) : IRequest<int>;
