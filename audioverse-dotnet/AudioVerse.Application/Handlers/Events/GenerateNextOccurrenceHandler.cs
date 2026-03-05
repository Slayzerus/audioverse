using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Generates the next occurrence of a recurring event.</summary>
public class GenerateNextOccurrenceHandler(IKaraokeRepository repo, IEventRepository eventRepo) : IRequestHandler<GenerateNextOccurrenceCommand, int>
{
    public async Task<int> Handle(GenerateNextOccurrenceCommand req, CancellationToken ct)
    {
        var parent = await repo.GetEventByIdAsync(req.EventId);
        if (parent == null || parent.Recurrence is null or RecurrencePattern.None)
            return 0;

        var interval = parent.RecurrenceInterval ?? 1;
        var baseStart = parent.StartTime ?? DateTime.UtcNow;
        var nextStart = parent.Recurrence switch
        {
            RecurrencePattern.Daily => baseStart.AddDays(interval),
            RecurrencePattern.Weekly => baseStart.AddDays(7 * interval),
            RecurrencePattern.BiWeekly => baseStart.AddDays(14),
            RecurrencePattern.Monthly => baseStart.AddMonths(interval),
            RecurrencePattern.Custom => baseStart.AddDays(interval),
            _ => baseStart.AddDays(7)
        };

        var duration = parent.EndTime.HasValue && parent.StartTime.HasValue
            ? parent.EndTime.Value - parent.StartTime.Value
            : (TimeSpan?)null;

        var next = new Event
        {
            Title = parent.Title,
            Description = parent.Description,
            Type = parent.Type,
            StartTime = nextStart,
            EndTime = duration.HasValue ? nextStart + duration.Value : null,
            OrganizerId = parent.OrganizerId,
            MaxParticipants = parent.MaxParticipants,
            WaitingListEnabled = parent.WaitingListEnabled,
            Visibility = parent.Visibility,
            LocationId = parent.LocationId,
            LocationName = parent.LocationName,
            LocationType = parent.LocationType,
            Access = parent.Access,
            Recurrence = parent.Recurrence,
            RecurrenceInterval = parent.RecurrenceInterval,
            SeriesParentId = parent.SeriesParentId ?? parent.Id,
            CarryOverProposals = parent.CarryOverProposals
        };

        var newId = await repo.CreateEventAsync(next);

        // Carry over un-picked proposals if enabled
        if (parent.CarryOverProposals)
        {
            var gamePicks = await eventRepo.GetGamePicksByEventAsync(parent.Id);
            foreach (var pick in gamePicks.Where(p => p.VoteCount == 0))
            {
                var carried = new EventSessionGamePick
                {
                    EventId = newId,
                    BoardGameId = pick.BoardGameId,
                    VideoGameId = pick.VideoGameId,
                    ProposedByUserId = pick.ProposedByUserId,
                    Notes = pick.Notes
                };
                await eventRepo.AddGamePickAsync(carried);
            }
        }

        return newId;
    }
}
