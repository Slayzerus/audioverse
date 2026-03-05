using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>List vendors attached to an event.</summary>
public record GetEventVendorsQuery(int EventId) : IRequest<IEnumerable<EventVendorDto>>;
