using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get a betting market by ID with options and bets.</summary>
public record GetBettingMarketQuery(int Id) : IRequest<BettingMarket?>;
