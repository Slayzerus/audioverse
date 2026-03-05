using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Services;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Repositories;

public class CampaignService : ICampaignService
{
    private readonly AudioVerseDbContext _db;
    private readonly IPlayerProgressService _progress;
    private readonly ILogger<CampaignService> _logger;

    public CampaignService(AudioVerseDbContext db, IPlayerProgressService progress, ILogger<CampaignService> logger)
    {
        _db = db;
        _progress = progress;
        _logger = logger;
    }

    public async Task<Campaign> StartCampaignAsync(int templateId, int playerId, CampaignCoopMode coopMode, CancellationToken ct)
    {
        var template = await _db.CampaignTemplates
            .Include(t => t.Rounds)
            .FirstOrDefaultAsync(t => t.Id == templateId, ct)
            ?? throw new InvalidOperationException($"Szablon kampanii {templateId} nie istnieje");

        var campaign = new Campaign
        {
            TemplateId = templateId,
            CoopMode = coopMode,
            CurrentRound = 1,
            Players = { new CampaignPlayer { PlayerId = playerId } }
        };

        // Utwórz postęp rund — pierwsza odblokowana, reszta zablokowana
        foreach (var round in template.Rounds.OrderBy(r => r.RoundNumber))
        {
            campaign.RoundProgress.Add(new CampaignRoundProgress
            {
                RoundNumber = round.RoundNumber,
                Status = round.RoundNumber == 1 ? CampaignRoundStatus.Unlocked : CampaignRoundStatus.Locked
            });
        }

        _db.Campaigns.Add(campaign);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Gracz {PlayerId} rozpoczął kampanię {CampaignId} (szablon {TemplateId})", playerId, campaign.Id, templateId);
        return campaign;
    }

    public async Task<bool> JoinCampaignAsync(int campaignId, int playerId, CancellationToken ct)
    {
        var campaign = await _db.Campaigns.Include(c => c.Players).FirstOrDefaultAsync(c => c.Id == campaignId, ct);
        if (campaign == null) return false;
        if (campaign.CoopMode == CampaignCoopMode.Solo) return false;
        if (campaign.Players.Any(p => p.PlayerId == playerId)) return true;

        campaign.Players.Add(new CampaignPlayer { PlayerId = playerId });
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<Campaign?> GetCampaignAsync(int campaignId, CancellationToken ct)
    {
        return await _db.Campaigns
            .Include(c => c.Template!).ThenInclude(t => t.Rounds).ThenInclude(r => r.SongPool).ThenInclude(s => s.Song)
            .Include(c => c.Template!).ThenInclude(t => t.Rounds).ThenInclude(r => r.RewardSkillDefinition)
            .Include(c => c.Players).ThenInclude(p => p.Player)
            .Include(c => c.RoundProgress)
            .FirstOrDefaultAsync(c => c.Id == campaignId, ct);
    }

    public async Task<IEnumerable<Campaign>> GetPlayerCampaignsAsync(int playerId, CancellationToken ct)
    {
        return await _db.Campaigns
            .Include(c => c.Template)
            .Include(c => c.Players)
            .Include(c => c.RoundProgress)
            .Where(c => c.Players.Any(p => p.PlayerId == playerId))
            .OrderByDescending(c => c.StartedAt)
            .ToListAsync(ct);
    }

    public async Task<CampaignRoundProgress?> ChooseSongAsync(int campaignId, int roundNumber, int songId, CancellationToken ct)
    {
        var rp = await _db.CampaignRoundProgress
            .FirstOrDefaultAsync(r => r.CampaignId == campaignId && r.RoundNumber == roundNumber, ct);
        if (rp == null || rp.Status == CampaignRoundStatus.Locked) return null;

        rp.ChosenSongId = songId;
        await _db.SaveChangesAsync(ct);
        return rp;
    }

    public async Task<CampaignRoundProgress?> SubmitRoundScoreAsync(int campaignId, int roundNumber, int playerId, int score, int? singingId, CancellationToken ct)
    {
        var campaign = await _db.Campaigns
            .Include(c => c.Players)
            .Include(c => c.RoundProgress)
            .Include(c => c.Template!).ThenInclude(t => t.Rounds)
            .FirstOrDefaultAsync(c => c.Id == campaignId, ct);
        if (campaign == null) return null;

        var rp = campaign.RoundProgress.FirstOrDefault(r => r.RoundNumber == roundNumber);
        if (rp == null || rp.Status == CampaignRoundStatus.Locked) return null;

        var templateRound = campaign.Template?.Rounds.FirstOrDefault(r => r.RoundNumber == roundNumber);
        if (templateRound == null) return null;

        // Aktualizuj wynik — weź najlepszy
        rp.BestScore = Math.Max(rp.BestScore ?? 0, score);
        rp.SingingId = singingId ?? rp.SingingId;

        // Oblicz efektywny wynik (zależnie od CoopMode)
        var effectiveScore = rp.BestScore.Value;

        // Sprawdź czy pułap osiągnięty
        if (effectiveScore >= templateRound.ScoreThreshold && rp.Status != CampaignRoundStatus.Completed)
        {
            rp.Status = CampaignRoundStatus.Completed;
            rp.CompletedAt = DateTime.UtcNow;
            rp.XpEarned = templateRound.XpReward;

            // Odblokuj następną rundę
            var nextRound = campaign.RoundProgress.FirstOrDefault(r => r.RoundNumber == roundNumber + 1);
            if (nextRound != null && nextRound.Status == CampaignRoundStatus.Locked)
            {
                nextRound.Status = CampaignRoundStatus.Unlocked;
                campaign.CurrentRound = roundNumber + 1;
            }

            // Aktualizuj łączny wynik kampanii
            campaign.TotalScore = campaign.RoundProgress.Sum(r => r.BestScore ?? 0);
            campaign.TotalXpEarned = campaign.RoundProgress.Sum(r => r.XpEarned);

            // Dodaj XP wszystkim graczom kampanii
            foreach (var cp in campaign.Players)
            {
                await _progress.AddXpAsync(cp.PlayerId, ProgressCategory.Campaign, templateRound.XpReward, "campaign_round", campaignId, ct);
            }

            // Odblokuj reward skill (jeśli zdefiniowany)
            if (templateRound.RewardSkillDefinitionId.HasValue)
            {
                foreach (var cp in campaign.Players)
                {
                    await _progress.UnlockSkillAsync(cp.PlayerId, templateRound.RewardSkillDefinitionId.Value, campaignId, ct);
                }
            }

            // Sprawdź czy cała kampania ukończona
            if (campaign.RoundProgress.All(r => r.Status == CampaignRoundStatus.Completed))
            {
                campaign.CompletedAt = DateTime.UtcNow;
                _logger.LogInformation("Kampania {CampaignId} ukończona!", campaignId);
            }
        }

        // Aktualizuj wynik gracza
        var player = campaign.Players.FirstOrDefault(p => p.PlayerId == playerId);
        if (player != null)
            player.TotalScore += score;

        await _db.SaveChangesAsync(ct);
        return rp;
    }

    public async Task<IEnumerable<CampaignTemplate>> GetTemplatesAsync(bool includePrivate, CancellationToken ct)
    {
        var q = _db.CampaignTemplates
            .Include(t => t.Rounds)
            .AsQueryable();

        if (!includePrivate)
            q = q.Where(t => t.IsPublic);

        return await q.OrderBy(t => t.Difficulty).ThenBy(t => t.Name).ToListAsync(ct);
    }

    public async Task<CampaignTemplate?> GetTemplateAsync(int templateId, CancellationToken ct)
    {
        return await _db.CampaignTemplates
            .Include(t => t.Rounds).ThenInclude(r => r.SongPool).ThenInclude(s => s.Song)
            .Include(t => t.Rounds).ThenInclude(r => r.RewardSkillDefinition)
            .FirstOrDefaultAsync(t => t.Id == templateId, ct);
    }

    public async Task<int> CreateTemplateAsync(CampaignTemplate template, CancellationToken ct)
    {
        _db.CampaignTemplates.Add(template);
        await _db.SaveChangesAsync(ct);
        return template.Id;
    }

    public async Task<bool> UpdateTemplateAsync(CampaignTemplate template, CancellationToken ct)
    {
        _db.CampaignTemplates.Update(template);
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
