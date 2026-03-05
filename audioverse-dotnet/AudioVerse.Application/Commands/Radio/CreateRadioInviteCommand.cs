using AudioVerse.Domain.Entities.Radio;
using MediatR;

namespace AudioVerse.Application.Commands.Radio;

/// <summary>Create a radio station invite and send an email with the link.</summary>
public record CreateRadioInviteCommand(int RadioStationId, int InvitedByUserId, string Email, DateTime ValidFrom, DateTime ValidTo, string? Message = null)
    : IRequest<RadioStationInvite>;
