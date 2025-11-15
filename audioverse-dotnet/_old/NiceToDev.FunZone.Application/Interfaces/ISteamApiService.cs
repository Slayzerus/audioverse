using NiceToDev.FunZone.Application.Models;

namespace NiceToDev.FunZone.Application.Interfaces
{
    public interface ISteamApiService
    {
        /// <summary>
        /// Get a list of games owned by a Steam user.
        /// </summary>
        /// <param name="steamId">Steam Id</param>
        /// <returns>List of games</returns>
        Task<List<SteamGame>> GetOwnedGamesAsync(string steamId);
    }
}
