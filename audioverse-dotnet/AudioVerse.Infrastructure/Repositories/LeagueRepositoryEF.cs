using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>EF Core implementation of ILeagueRepository.</summary>
public class LeagueRepositoryEF(AudioVerseDbContext db) : ILeagueRepository
{
    // ── Organization ──

    public async Task<int> CreateOrganizationAsync(Organization org)
    {
        db.Organizations.Add(org);
        await db.SaveChangesAsync();
        return org.Id;
    }

    public Task<Organization?> GetOrganizationByIdAsync(int id) =>
        db.Organizations.Include(o => o.Leagues).FirstOrDefaultAsync(o => o.Id == id);

    public async Task<(IEnumerable<Organization> Items, int TotalCount)> GetOrganizationsPagedAsync(int page, int pageSize)
    {
        var total = await db.Organizations.CountAsync();
        var items = await db.Organizations
            .OrderBy(o => o.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
        return (items, total);
    }

    public async Task<bool> UpdateOrganizationAsync(Organization org)
    {
        db.Organizations.Update(org);
        return await db.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteOrganizationAsync(int id)
    {
        var e = await db.Organizations.FindAsync(id);
        if (e == null) return false;
        db.Organizations.Remove(e);
        return await db.SaveChangesAsync() > 0;
    }

    // ── League ──

    public async Task<int> CreateLeagueAsync(League league)
    {
        db.Leagues.Add(league);
        await db.SaveChangesAsync();
        return league.Id;
    }

    public Task<League?> GetLeagueByIdAsync(int id) =>
        db.Leagues
            .Include(l => l.Participants)
            .Include(l => l.Events).ThenInclude(le => le.Event)
            .Include(l => l.Organization)
            .FirstOrDefaultAsync(l => l.Id == id);

    public async Task<(IEnumerable<League> Items, int TotalCount)> GetLeaguesPagedAsync(int? organizationId, int page, int pageSize)
    {
        var q = db.Leagues.AsQueryable();
        if (organizationId.HasValue)
            q = q.Where(l => l.OrganizationId == organizationId.Value);
        var total = await q.CountAsync();
        var items = await q.OrderBy(l => l.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
        return (items, total);
    }

    public async Task<bool> UpdateLeagueAsync(League league)
    {
        db.Leagues.Update(league);
        return await db.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteLeagueAsync(int id)
    {
        var e = await db.Leagues.FindAsync(id);
        if (e == null) return false;
        db.Leagues.Remove(e);
        return await db.SaveChangesAsync() > 0;
    }

    // ── Participants ──

    public async Task<int> AddParticipantAsync(LeagueParticipant participant)
    {
        db.LeagueParticipants.Add(participant);
        await db.SaveChangesAsync();
        return participant.Id;
    }

    public async Task<IEnumerable<LeagueParticipant>> GetParticipantsByLeagueAsync(int leagueId) =>
        await db.LeagueParticipants.Where(p => p.LeagueId == leagueId)
            .OrderByDescending(p => p.Points).ThenBy(p => p.Name)
            .ToListAsync();

    public async Task<bool> RemoveParticipantAsync(int id)
    {
        var e = await db.LeagueParticipants.FindAsync(id);
        if (e == null) return false;
        db.LeagueParticipants.Remove(e);
        return await db.SaveChangesAsync() > 0;
    }

    // ── League Events ──

    public async Task<int> AddLeagueEventAsync(LeagueEvent leagueEvent)
    {
        db.LeagueEvents.Add(leagueEvent);
        await db.SaveChangesAsync();
        return leagueEvent.Id;
    }

    public async Task<IEnumerable<LeagueEvent>> GetLeagueEventsAsync(int leagueId) =>
        await db.LeagueEvents.Where(le => le.LeagueId == leagueId)
            .Include(le => le.Event)
            .OrderBy(le => le.RoundNumber).ThenBy(le => le.MatchNumber)
            .ToListAsync();

    // ── Fantasy ──

    public async Task<int> CreateFantasyTeamAsync(FantasyTeam team)
    {
        db.FantasyTeams.Add(team);
        await db.SaveChangesAsync();
        return team.Id;
    }

    public Task<FantasyTeam?> GetFantasyTeamByIdAsync(int id) =>
        db.FantasyTeams.Include(t => t.Players).FirstOrDefaultAsync(t => t.Id == id);

    public async Task<IEnumerable<FantasyTeam>> GetFantasyTeamsByLeagueAsync(int leagueId) =>
        await db.FantasyTeams.Where(t => t.LeagueId == leagueId)
            .Include(t => t.Players)
            .OrderByDescending(t => t.TotalPoints)
            .ToListAsync();

    public async Task<bool> UpdateFantasyTeamAsync(FantasyTeam team)
    {
        db.FantasyTeams.Update(team);
        return await db.SaveChangesAsync() > 0;
    }

    public async Task<int> AddFantasyPlayerAsync(FantasyTeamPlayer player)
    {
        db.FantasyTeamPlayers.Add(player);
        await db.SaveChangesAsync();
        return player.Id;
    }

    public async Task<bool> RemoveFantasyPlayerAsync(int playerId)
    {
        var e = await db.FantasyTeamPlayers.FindAsync(playerId);
        if (e == null) return false;
        db.FantasyTeamPlayers.Remove(e);
        return await db.SaveChangesAsync() > 0;
    }
}
