using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Infrastructure.Repositories;

/// <summary>EF Core implementation of IBettingRepository.</summary>
public class BettingRepositoryEF(AudioVerseDbContext db) : IBettingRepository
{
    // ── Markets ──

    public async Task<int> CreateMarketAsync(BettingMarket market)
    {
        db.BettingMarkets.Add(market);
        await db.SaveChangesAsync();
        return market.Id;
    }

    public Task<BettingMarket?> GetMarketByIdAsync(int id) =>
        db.BettingMarkets
            .Include(m => m.Options)
            .Include(m => m.Bets)
            .FirstOrDefaultAsync(m => m.Id == id);

    public async Task<IEnumerable<BettingMarket>> GetMarketsByEventAsync(int eventId) =>
        await db.BettingMarkets
            .Where(m => m.EventId == eventId)
            .Include(m => m.Options)
            .ToListAsync();

    public async Task<bool> UpdateMarketAsync(BettingMarket market)
    {
        db.BettingMarkets.Update(market);
        return await db.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteMarketAsync(int id)
    {
        var e = await db.BettingMarkets.FindAsync(id);
        if (e == null) return false;
        db.BettingMarkets.Remove(e);
        return await db.SaveChangesAsync() > 0;
    }

    // ── Options ──

    public async Task<int> AddOptionAsync(BettingOption option)
    {
        db.BettingOptions.Add(option);
        await db.SaveChangesAsync();
        return option.Id;
    }

    public async Task<bool> RemoveOptionAsync(int id)
    {
        var e = await db.BettingOptions.FindAsync(id);
        if (e == null) return false;
        db.BettingOptions.Remove(e);
        return await db.SaveChangesAsync() > 0;
    }

    // ── Bets ──

    public async Task<int> PlaceBetAsync(Bet bet)
    {
        db.Bets.Add(bet);
        await db.SaveChangesAsync();
        return bet.Id;
    }

    public async Task<IEnumerable<Bet>> GetBetsByMarketAsync(int marketId) =>
        await db.Bets.Where(b => b.MarketId == marketId)
            .Include(b => b.Option)
            .OrderByDescending(b => b.PlacedAt)
            .ToListAsync();

    public async Task<IEnumerable<Bet>> GetBetsByUserAsync(int userId, int? leagueId = null)
    {
        var q = db.Bets.Where(b => b.UserId == userId).Include(b => b.Market).Include(b => b.Option);
        if (leagueId.HasValue)
            return await q.Where(b => b.Market != null && b.Market.LeagueId == leagueId.Value).ToListAsync();
        return await q.ToListAsync();
    }

    // ── Wallets ──

    public async Task<VirtualWallet> GetOrCreateWalletAsync(int userId, int? leagueId, decimal initialBalance = 1000m)
    {
        var wallet = await db.VirtualWallets
            .FirstOrDefaultAsync(w => w.UserId == userId && w.LeagueId == leagueId);

        if (wallet != null) return wallet;

        wallet = new VirtualWallet
        {
            UserId = userId,
            LeagueId = leagueId,
            Balance = initialBalance
        };
        db.VirtualWallets.Add(wallet);
        await db.SaveChangesAsync();
        return wallet;
    }

    public async Task<bool> UpdateWalletAsync(VirtualWallet wallet)
    {
        db.VirtualWallets.Update(wallet);
        return await db.SaveChangesAsync() > 0;
    }

    // ── Resolution ──

    public async Task<int> ResolveMarketAsync(int marketId, int winningOptionId)
    {
        var market = await db.BettingMarkets
            .Include(m => m.Bets)
            .FirstOrDefaultAsync(m => m.Id == marketId);
        if (market == null) return 0;

        market.IsOpen = false;
        market.WinningOptionId = winningOptionId;
        market.ResolvedAt = DateTime.UtcNow;

        var payouts = 0;
        foreach (var bet in market.Bets)
        {
            bet.Won = bet.OptionId == winningOptionId;
            bet.ActualPayout = bet.Won == true ? bet.PotentialPayout : 0;

            if (bet.Won == true)
            {
                var wallet = await GetOrCreateWalletAsync(bet.UserId, market.LeagueId);
                wallet.Balance += bet.ActualPayout;
                wallet.TotalWon += bet.ActualPayout;
                payouts++;
            }
        }

        await db.SaveChangesAsync();
        return payouts;
    }
}
