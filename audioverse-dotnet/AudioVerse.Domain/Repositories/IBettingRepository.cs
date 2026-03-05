using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Domain.Repositories;

/// <summary>Repository for betting markets, bets, and virtual wallets.</summary>
public interface IBettingRepository
{
    // ── Markets ──
    Task<int> CreateMarketAsync(BettingMarket market);
    Task<BettingMarket?> GetMarketByIdAsync(int id);
    Task<IEnumerable<BettingMarket>> GetMarketsByEventAsync(int eventId);
    Task<bool> UpdateMarketAsync(BettingMarket market);
    Task<bool> DeleteMarketAsync(int id);

    // ── Options ──
    Task<int> AddOptionAsync(BettingOption option);
    Task<bool> RemoveOptionAsync(int id);

    // ── Bets ──
    Task<int> PlaceBetAsync(Bet bet);
    Task<IEnumerable<Bet>> GetBetsByMarketAsync(int marketId);
    Task<IEnumerable<Bet>> GetBetsByUserAsync(int userId, int? leagueId = null);

    // ── Wallets ──
    Task<VirtualWallet> GetOrCreateWalletAsync(int userId, int? leagueId, decimal initialBalance = 1000m);
    Task<bool> UpdateWalletAsync(VirtualWallet wallet);

    // ── Resolution ──
    Task<int> ResolveMarketAsync(int marketId, int winningOptionId);
}
