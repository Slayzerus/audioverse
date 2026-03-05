using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Models.Requests.Karaoke;

public record StartCampaignRequest(int TemplateId, CampaignCoopMode CoopMode = CampaignCoopMode.Solo);
