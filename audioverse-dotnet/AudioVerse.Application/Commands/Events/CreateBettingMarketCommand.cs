using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Create a betting market for an event.</summary>
public record CreateBettingMarketCommand(BettingMarket Market) : IRequest<int>;
