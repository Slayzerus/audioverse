using AudioVerse.Domain.Entities.Events;
using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>Add a selectable option to a betting market.</summary>
public record AddBettingOptionCommand(BettingOption Option) : IRequest<int>;
