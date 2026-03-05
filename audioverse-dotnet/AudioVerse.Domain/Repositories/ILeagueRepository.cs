using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Domain.Repositories;

/// <summary>Repository for Organization, League, Fantasy operations.</summary>
public interface ILeagueRepository
{
    // ── Organization ──
    Task<int> CreateOrganizationAsync(Organization org);
    Task<Organization?> GetOrganizationByIdAsync(int id);
    Task<(IEnumerable<Organization> Items, int TotalCount)> GetOrganizationsPagedAsync(int page, int pageSize);
    Task<bool> UpdateOrganizationAsync(Organization org);
    Task<bool> DeleteOrganizationAsync(int id);

    // ── League ──
    Task<int> CreateLeagueAsync(League league);
    Task<League?> GetLeagueByIdAsync(int id);
    Task<(IEnumerable<League> Items, int TotalCount)> GetLeaguesPagedAsync(int? organizationId, int page, int pageSize);
    Task<bool> UpdateLeagueAsync(League league);
    Task<bool> DeleteLeagueAsync(int id);

    // ── League Participants ──
    Task<int> AddParticipantAsync(LeagueParticipant participant);
    Task<IEnumerable<LeagueParticipant>> GetParticipantsByLeagueAsync(int leagueId);
    Task<bool> RemoveParticipantAsync(int id);

    // ── League Events ──
    Task<int> AddLeagueEventAsync(LeagueEvent leagueEvent);
    Task<IEnumerable<LeagueEvent>> GetLeagueEventsAsync(int leagueId);

    // ── Fantasy ──
    Task<int> CreateFantasyTeamAsync(FantasyTeam team);
    Task<FantasyTeam?> GetFantasyTeamByIdAsync(int id);
    Task<IEnumerable<FantasyTeam>> GetFantasyTeamsByLeagueAsync(int leagueId);
    Task<bool> UpdateFantasyTeamAsync(FantasyTeam team);
    Task<int> AddFantasyPlayerAsync(FantasyTeamPlayer player);
    Task<bool> RemoveFantasyPlayerAsync(int playerId);
}
