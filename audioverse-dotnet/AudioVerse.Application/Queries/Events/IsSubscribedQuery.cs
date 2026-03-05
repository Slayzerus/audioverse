using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record IsSubscribedQuery(int UserId, int EventId) : IRequest<bool>;
