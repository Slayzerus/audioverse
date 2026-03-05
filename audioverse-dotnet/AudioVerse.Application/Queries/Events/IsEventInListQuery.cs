using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Queries.Events;

public record IsEventInListQuery(int ListId, int EventId) : IRequest<bool>;
