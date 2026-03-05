using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Services;

/// <summary>Serwis zarządzania kampaniami karaoke.</summary>
public interface ICampaignService
{
    Task<Campaign> StartCampaignAsync(int templateId, int playerId, CampaignCoopMode coopMode = CampaignCoopMode.Solo, CancellationToken ct = default);
    Task<bool> JoinCampaignAsync(int campaignId, int playerId, CancellationToken ct = default);
    Task<Campaign?> GetCampaignAsync(int campaignId, CancellationToken ct = default);
    Task<IEnumerable<Campaign>> GetPlayerCampaignsAsync(int playerId, CancellationToken ct = default);
    Task<CampaignRoundProgress?> ChooseSongAsync(int campaignId, int roundNumber, int songId, CancellationToken ct = default);
    Task<CampaignRoundProgress?> SubmitRoundScoreAsync(int campaignId, int roundNumber, int playerId, int score, int? singingId = null, CancellationToken ct = default);
    Task<IEnumerable<CampaignTemplate>> GetTemplatesAsync(bool includePrivate = false, CancellationToken ct = default);
    Task<CampaignTemplate?> GetTemplateAsync(int templateId, CancellationToken ct = default);
    Task<int> CreateTemplateAsync(CampaignTemplate template, CancellationToken ct = default);
    Task<bool> UpdateTemplateAsync(CampaignTemplate template, CancellationToken ct = default);
}
