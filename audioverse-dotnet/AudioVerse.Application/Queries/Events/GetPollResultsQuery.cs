using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record GetPollResultsQuery(int PollId) : IRequest<PollResultsDto?>;

