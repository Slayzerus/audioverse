using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Auto-generates round-robin schedule of events for a league.</summary>
public class GenerateLeagueScheduleHandler(ILeagueRepository repo, IKaraokeRepository eventRepo) : IRequestHandler<GenerateLeagueScheduleCommand, int>
{
    public async Task<int> Handle(GenerateLeagueScheduleCommand req, CancellationToken ct)
    {
        var league = await repo.GetLeagueByIdAsync(req.LeagueId);
        if (league == null || league.Participants.Count < 2) return 0;

        var participants = league.Participants.Where(p => !p.IsEliminated).ToList();
        var matchDate = req.FirstMatchDate;
        var created = 0;

        // Round-robin: every participant plays every other
        var n = participants.Count;
        var rounds = n % 2 == 0 ? n - 1 : n;

        for (int round = 0; round < rounds; round++)
        {
            var matchesInRound = n / 2;
            for (int match = 0; match < matchesInRound; match++)
            {
                var home = (round + match) % (n - 1);
                var away = (n - 1 - match + round) % (n - 1);
                if (match == 0) away = n - 1;

                var ev = new Event
                {
                    Title = $"{league.Name}: {participants[home].Name} vs {participants[away].Name}",
                    Description = $"Round {round + 1}, Match {match + 1}",
                    Type = Domain.Enums.Events.EventType.Event,
                    StartTime = matchDate.AddHours(match * 2),
                    OrganizerId = league.OwnerId
                };

                var eventId = await eventRepo.CreateEventAsync(ev);

                await repo.AddLeagueEventAsync(new LeagueEvent
                {
                    LeagueId = req.LeagueId,
                    EventId = eventId,
                    RoundNumber = round + 1,
                    MatchNumber = match + 1,
                    Label = $"R{round + 1}M{match + 1}"
                });

                created++;
            }

            matchDate = matchDate.AddDays(req.DaysBetweenRounds);
        }

        league.Status = LeagueStatus.InProgress;
        await repo.UpdateLeagueAsync(league);

        return created;
    }
}
