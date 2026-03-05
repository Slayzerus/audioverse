using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Auto-generate a schedule of events (matches) for a league based on participants and type.</summary>
public record GenerateLeagueScheduleCommand(int LeagueId, DateTime FirstMatchDate, int DaysBetweenRounds = 7) : IRequest<int>;
