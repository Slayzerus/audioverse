using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetEventBillingSettlementQuery(int EventId) : IRequest<EventSettlementDto>;

