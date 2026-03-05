using MediatR;

namespace AudioVerse.Application.Commands.Radio;

/// <summary>Verify an invite by token (public — guest clicks link).</summary>
public record VerifyRadioInviteCommand(string Token) : IRequest<RadioInviteVerifyResult?>;
