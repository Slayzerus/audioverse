using System.Collections.Generic;
using System.Threading.Tasks;
using StackExchange.Redis;
using System.Linq;

namespace AudioVerse.Infrastructure.Realtime
{
    public class RedisLobbyStore : ILobbyStore
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly IDatabase _db;

        public RedisLobbyStore(IConnectionMultiplexer redis)
        {
            _redis = redis;
            _db = _redis.GetDatabase();
        }

        private static string Key(int eventId, string? channel) => $"lobby:{eventId}:channel:{(string.IsNullOrEmpty(channel) ? "default" : channel)}";

        public async Task AddMemberAsync(int eventId, string connectionId, string username, string? channel = null)
        {
            await _db.HashSetAsync(Key(eventId, channel), connectionId, username ?? string.Empty);
        }

        public async Task RemoveMemberAsync(int eventId, string connectionId, string? channel = null)
        {
            await _db.HashDeleteAsync(Key(eventId, channel), connectionId);
        }

        public async Task<List<(string ConnectionId, string Username)>> GetMembersAsync(int eventId, string? channel = null)
        {
            var entries = await _db.HashGetAllAsync(Key(eventId, channel));
            return entries.Select(e => (e.Name.ToString(), e.Value.ToString())).ToList();
        }
    }
}
