using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to send poll invitation emails.
/// </summary>
/// <param name="PollId">Poll ID</param>
/// <param name="Emails">List of email addresses</param>
/// <param name="BaseUrl">Base URL for poll links</param>
public record SendPollEmailsCommand(int PollId, List<string> Emails, string BaseUrl) : IRequest<int>;
