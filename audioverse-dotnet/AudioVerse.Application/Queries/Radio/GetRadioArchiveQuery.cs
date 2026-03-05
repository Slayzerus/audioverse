using MediatR;

namespace AudioVerse.Application.Queries.Radio;

/// <summary>Get archive timeline for a station day — voice segments + metadata.</summary>
public record GetRadioArchiveQuery(int RadioStationId, DateTime Date) : IRequest<IEnumerable<ArchiveEntryDto>>;
