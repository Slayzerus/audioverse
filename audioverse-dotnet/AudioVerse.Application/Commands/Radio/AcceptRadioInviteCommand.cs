using MediatR;

namespace AudioVerse.Application.Commands.Radio;

/// <summary>Accept an invite — guest confirms participation.</summary>
public record AcceptRadioInviteCommand(string Token, string? GuestName = null) : IRequest<RadioInviteAcceptResult?>;
