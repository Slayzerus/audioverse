using MediatR;

namespace AudioVerse.Application.Commands.Radio;

/// <summary>Revoke a radio station invite.</summary>
public record RevokeRadioInviteCommand(int RadioStationId, int InviteId) : IRequest<bool>;
