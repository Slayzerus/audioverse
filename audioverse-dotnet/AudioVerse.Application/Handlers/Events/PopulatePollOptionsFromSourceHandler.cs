using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

public class PopulatePollOptionsFromSourceHandler(IEventRepository r) : IRequestHandler<PopulatePollOptionsFromSourceCommand, int>
{
    public async Task<int> Handle(PopulatePollOptionsFromSourceCommand req, CancellationToken ct)
    {
        var poll = await r.GetPollByIdAsync(req.PollId);
        if (poll == null) return 0;

        await r.DeletePollOptionsAsync(poll.Id);

        IEnumerable<(string text, int? entityId, Domain.Enums.Events.EventPollOptionSource entityType)> sources = poll.OptionSource switch
        {
            Domain.Enums.Events.EventPollOptionSource.BoardGames =>
                (await r.GetEventBoardGamesAsync(poll.EventId)).Select(g => (g.BoardGame?.Name ?? $"BoardGame#{g.BoardGameId}", g.BoardGameId, Domain.Enums.Events.EventPollOptionSource.BoardGames)),
            Domain.Enums.Events.EventPollOptionSource.VideoGames =>
                (await r.GetEventVideoGamesAsync(poll.EventId)).Select(g => (g.VideoGame?.Name ?? $"VideoGame#{g.VideoGameId}", (int?)g.VideoGameId, Domain.Enums.Events.EventPollOptionSource.VideoGames)),
            Domain.Enums.Events.EventPollOptionSource.MenuItems =>
                (await r.GetMenuByEventAsync(poll.EventId)).Select(m => (m.Name, (int?)m.Id, Domain.Enums.Events.EventPollOptionSource.MenuItems)),
            Domain.Enums.Events.EventPollOptionSource.Attractions =>
                (await r.GetAttractionsByEventAsync(poll.EventId)).Select(a => (a.Name, (int?)a.Id, Domain.Enums.Events.EventPollOptionSource.Attractions)),
            _ => Enumerable.Empty<(string, int?, Domain.Enums.Events.EventPollOptionSource)>()
        };

        int count = 0;
        int order = 0;
        foreach (var (text, entityId, entityType) in sources)
        {
            await r.AddPollOptionAsync(new EventPollOption
            {
                PollId = poll.Id,
                Text = text,
                SortOrder = order++,
                SourceEntityId = entityId,
                SourceEntityType = entityType
            });
            count++;
        }
        return count;
    }
}
