using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Domain.Repositories;

/// <summary>
/// Repository for event polls and voting.
/// </summary>
public interface IPollRepository
{
    /// <summary>
    /// Creates a new poll.
    /// </summary>
    Task<int> CreatePollAsync(EventPoll poll);

    /// <summary>
    /// Gets a poll by ID with options.
    /// </summary>
    Task<EventPoll?> GetByIdAsync(int id);

    /// <summary>
    /// Gets all polls for an event.
    /// </summary>
    Task<IEnumerable<EventPoll>> GetByEventAsync(int eventId);

    /// <summary>
    /// Updates poll details.
    /// </summary>
    Task<bool> UpdatePollAsync(EventPoll poll);

    /// <summary>
    /// Deletes a poll and its options/responses.
    /// </summary>
    Task<bool> DeletePollAsync(int id);

    /// <summary>
    /// Adds a vote to a poll option.
    /// </summary>
    /// <param name="pollId">The poll ID</param>
    /// <param name="optionId">The option ID</param>
    /// <param name="userId">User ID (if authenticated)</param>
    /// <param name="voterToken">Anonymous voter token (if not authenticated)</param>
    Task<int> AddVoteAsync(int pollId, int optionId, int? userId, string? voterToken);

    /// <summary>
    /// Gets vote counts for each option in a poll.
    /// </summary>
    Task<IDictionary<int, int>> GetVoteCountsAsync(int pollId);

    /// <summary>
    /// Checks if a user has already voted in a poll.
    /// </summary>
    Task<bool> HasUserVotedAsync(int pollId, int? userId, string? voterToken);

    /// <summary>
    /// Adds an option to a poll.
    /// </summary>
    Task<int> AddOptionAsync(EventPollOption option);

    /// <summary>
    /// Removes an option from a poll.
    /// </summary>
    Task<bool> RemoveOptionAsync(int optionId);

    /// <summary>
    /// Closes a poll (no more voting allowed).
    /// </summary>
    Task<bool> ClosePollAsync(int pollId);
}
