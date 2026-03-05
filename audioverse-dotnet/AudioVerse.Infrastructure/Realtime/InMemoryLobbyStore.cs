using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AudioVerse.Infrastructure.Realtime
{
    public class InMemoryLobbyStore : ILobbyStore
    {
        private readonly ConcurrentDictionary<int, ConcurrentDictionary<string, ConcurrentDictionary<string, string>>> _map = new();

        private static string ChannelKey(string? channel) => channel ?? "default";

        public Task AddMemberAsync(int eventId, string connectionId, string username, string? channel = null)
        {
            var channels = _map.GetOrAdd(eventId, _ => new ConcurrentDictionary<string, ConcurrentDictionary<string, string>>());
            var dict = channels.GetOrAdd(ChannelKey(channel), _ => new ConcurrentDictionary<string, string>());
            dict[connectionId] = username ?? string.Empty;
            return Task.CompletedTask;
        }

        public Task RemoveMemberAsync(int eventId, string connectionId, string? channel = null)
        {
            if (_map.TryGetValue(eventId, out var channels))
            {
                if (channels.TryGetValue(ChannelKey(channel), out var dict))
                {
                    dict.TryRemove(connectionId, out var _);
                }
            }
            return Task.CompletedTask;
        }

        public Task<List<(string ConnectionId, string Username)>> GetMembersAsync(int eventId, string? channel = null)
        {
            if (_map.TryGetValue(eventId, out var channels))
            {
                if (channels.TryGetValue(ChannelKey(channel), out var dict))
                {
                    var list = dict.Select(kvp => (kvp.Key, kvp.Value)).ToList();
                    return Task.FromResult(list);
                }
            }
            return Task.FromResult(new List<(string, string)>());
        }
    }
}
