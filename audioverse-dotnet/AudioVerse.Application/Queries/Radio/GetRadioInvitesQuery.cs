using MediatR;

namespace AudioVerse.Application.Queries.Radio;

/// <summary>Get invites for a radio station.</summary>
public record GetRadioInvitesQuery(int RadioStationId) : IRequest<IEnumerable<RadioInviteDto>>;
