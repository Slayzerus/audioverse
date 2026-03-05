using System.Collections.Generic;
using System.Threading.Tasks;

namespace AudioVerse.Infrastructure.Realtime
{
    public interface ILobbyStore
    {
        Task AddMemberAsync(int eventId, string connectionId, string username, string? channel = null);
        Task RemoveMemberAsync(int eventId, string connectionId, string? channel = null);
        Task<List<(string ConnectionId, string Username)>> GetMembersAsync(int eventId, string? channel = null);
    }
}
