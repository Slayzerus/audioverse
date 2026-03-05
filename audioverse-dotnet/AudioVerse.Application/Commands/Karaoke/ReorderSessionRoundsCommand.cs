using MediatR;

namespace AudioVerse.Application.Commands.Karaoke
{
    /// <summary>
    /// Reorder rounds within a session. The list contains round IDs in the desired order.
    /// </summary>
    public record ReorderSessionRoundsCommand(int SessionId, List<int> RoundIds) : IRequest<bool>;
}
