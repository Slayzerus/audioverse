using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>
/// Entity Framework implementation of IPollRepository.
/// Handles event polls and voting.
/// </summary>
public class PollRepositoryEF : IPollRepository
{
    private readonly AudioVerseDbContext _dbContext;
    private readonly ILogger<PollRepositoryEF> _logger;

    public PollRepositoryEF(AudioVerseDbContext dbContext, ILogger<PollRepositoryEF> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<int> CreatePollAsync(EventPoll poll)
    {
        poll.CreatedAt = DateTime.UtcNow;
        _dbContext.EventPolls.Add(poll);
        await _dbContext.SaveChangesAsync();
        return poll.Id;
    }

    /// <inheritdoc />
    public async Task<EventPoll?> GetByIdAsync(int id)
    {
        return await _dbContext.EventPolls
            .Include(p => p.Options)
            .Include(p => p.Responses)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    /// <inheritdoc />
    public async Task<IEnumerable<EventPoll>> GetByEventAsync(int eventId)
    {
        return await _dbContext.EventPolls
            .Where(p => p.EventId == eventId)
            .Include(p => p.Options)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    /// <inheritdoc />
    public async Task<bool> UpdatePollAsync(EventPoll poll)
    {
        var existing = await _dbContext.EventPolls.FindAsync(poll.Id);
        if (existing == null) return false;

        existing.Title = poll.Title;
        existing.Description = poll.Description;
        existing.ExpiresAt = poll.ExpiresAt;
        existing.IsActive = poll.IsActive;
        existing.TrackCosts = poll.TrackCosts;

        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> DeletePollAsync(int id)
    {
        var poll = await _dbContext.EventPolls
            .Include(p => p.Options)
            .Include(p => p.Responses)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (poll == null) return false;

        _dbContext.EventPollResponses.RemoveRange(poll.Responses);
        _dbContext.EventPollOptions.RemoveRange(poll.Options);
        _dbContext.EventPolls.Remove(poll);
        
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation("Poll {Id} deleted", id);
        return true;
    }

    /// <inheritdoc />
    public async Task<int> AddVoteAsync(int pollId, int optionId, int? userId, string? voterToken)
    {
        var response = new EventPollResponse
        {
            PollId = pollId,
            OptionId = optionId,
            RespondentUserId = userId,
            RespondentEmail = voterToken,
            RespondedAt = DateTime.UtcNow
        };

        _dbContext.EventPollResponses.Add(response);
        await _dbContext.SaveChangesAsync();
        return response.Id;
    }

    /// <inheritdoc />
    public async Task<IDictionary<int, int>> GetVoteCountsAsync(int pollId)
    {
        var responses = await _dbContext.EventPollResponses
            .Where(r => r.PollId == pollId)
            .GroupBy(r => r.OptionId)
            .Select(g => new { OptionId = g.Key, Count = g.Sum(r => r.Quantity) })
            .ToListAsync();

        return responses.ToDictionary(r => r.OptionId, r => r.Count);
    }

    /// <inheritdoc />
    public async Task<bool> HasUserVotedAsync(int pollId, int? userId, string? voterToken)
    {
        if (userId.HasValue)
        {
            return await _dbContext.EventPollResponses
                .AnyAsync(r => r.PollId == pollId && r.RespondentUserId == userId);
        }
        
        if (!string.IsNullOrEmpty(voterToken))
        {
            return await _dbContext.EventPollResponses
                .AnyAsync(r => r.PollId == pollId && r.RespondentEmail == voterToken);
        }

        return false;
    }

    /// <inheritdoc />
    public async Task<int> AddOptionAsync(EventPollOption option)
    {
        _dbContext.EventPollOptions.Add(option);
        await _dbContext.SaveChangesAsync();
        return option.Id;
    }

    /// <inheritdoc />
    public async Task<bool> RemoveOptionAsync(int optionId)
    {
        var option = await _dbContext.EventPollOptions.FindAsync(optionId);
        if (option == null) return false;

        // Also remove any responses for this option
        var responses = await _dbContext.EventPollResponses
            .Where(r => r.OptionId == optionId)
            .ToListAsync();
        
        _dbContext.EventPollResponses.RemoveRange(responses);
        _dbContext.EventPollOptions.Remove(option);
        
        await _dbContext.SaveChangesAsync();
        return true;
    }

    /// <inheritdoc />
    public async Task<bool> ClosePollAsync(int pollId)
    {
        var poll = await _dbContext.EventPolls.FindAsync(pollId);
        if (poll == null) return false;

        poll.IsActive = false;
        await _dbContext.SaveChangesAsync();
        
        _logger.LogInformation("Poll {Id} closed", pollId);
        return true;
    }
}
