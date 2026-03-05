using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

/// <summary>Get all betting markets for an event.</summary>
public record GetBettingMarketsByEventQuery(int EventId) : IRequest<IEnumerable<BettingMarket>>;
