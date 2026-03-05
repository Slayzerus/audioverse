using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Add a new sport activity to the catalog.</summary>
public record AddSportCommand(SportActivity Sport) : IRequest<int>;
