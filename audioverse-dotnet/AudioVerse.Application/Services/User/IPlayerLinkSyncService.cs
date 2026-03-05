using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Enums;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Application.Services.User
{
    /// <summary>
    /// Propaguje zmiany do zlinkowanych graczy w ramach zdefiniowanego zakresu.
    /// </summary>
    public interface IPlayerLinkSyncService
    {
        /// <summary>
        /// Synchronizuje dane gracza źródłowego do wszystkich aktywnych linków.
        /// </summary>
        Task SyncLinkedPlayersAsync(int playerId);
    }
}
