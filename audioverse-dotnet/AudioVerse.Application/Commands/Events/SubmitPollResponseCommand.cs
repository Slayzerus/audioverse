using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to submit a response to a poll.
/// </summary>
/// <param name="Token">Poll access token</param>
/// <param name="OptionIds">Selected option IDs</param>
/// <param name="Email">Respondent email (optional)</param>
/// <param name="UserId">Respondent user ID (optional)</param>
/// <param name="Quantities">Quantities per option for quantity-based polls</param>
public record SubmitPollResponseCommand(
    string Token, 
    List<int> OptionIds, 
    string? Email, 
    int? UserId, 
    Dictionary<int, int>? Quantities) : IRequest<bool>;
