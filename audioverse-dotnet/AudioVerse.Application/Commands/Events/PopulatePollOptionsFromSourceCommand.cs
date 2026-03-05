using MediatR;

namespace AudioVerse.Application.Commands.Events;

/// <summary>
/// Command to populate poll options from a source (menu items, attractions, etc.).
/// </summary>
public record PopulatePollOptionsFromSourceCommand(int PollId) : IRequest<int>;
