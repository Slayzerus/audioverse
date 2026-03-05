using AudioVerse.API.Models.Requests.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.Campaigns;
using AudioVerse.Domain.Enums;
using AudioVerse.Domain.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Karaoke.Controllers;

[ApiController]
[Route("api/karaoke/campaigns")]
[Produces("application/json")]
[Authorize]
public class CampaignController : ControllerBase
{
    private readonly ICampaignService _campaigns;
    private readonly IPlayerProgressService _progress;
    private readonly ILogger<CampaignController> _logger;

    public CampaignController(ICampaignService campaigns, IPlayerProgressService progress, ILogger<CampaignController> logger)
    {
        _campaigns = campaigns;
        _progress = progress;
        _logger = logger;
    }

    // ── Szablony ──

    /// <summary>Pobierz listę szablonów kampanii.</summary>
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates([FromQuery] bool includePrivate = false)
    {
        var templates = await _campaigns.GetTemplatesAsync(includePrivate || User.IsInRole("Admin"));
        return Ok(templates);
    }

    /// <summary>Pobierz szczegóły szablonu kampanii (z rundami, pulami piosenek).</summary>
    [HttpGet("templates/{templateId}")]
    public async Task<IActionResult> GetTemplate(int templateId)
    {
        var template = await _campaigns.GetTemplateAsync(templateId);
        return template != null ? Ok(template) : NotFound();
    }

    /// <summary>Utwórz nowy szablon kampanii.</summary>
    [HttpPost("templates")]
    public async Task<IActionResult> CreateTemplate([FromBody] CampaignTemplate template)
    {
        if (template == null) return BadRequest();
        var uid = GetPlayerId();
        if (uid == null) return Unauthorized();
        template.CreatedByPlayerId = uid;
        var id = await _campaigns.CreateTemplateAsync(template);
        return CreatedAtAction(nameof(GetTemplate), new { templateId = id }, new { Id = id });
    }

    /// <summary>Aktualizuj szablon kampanii.</summary>
    [HttpPut("templates/{templateId}")]
    public async Task<IActionResult> UpdateTemplate(int templateId, [FromBody] CampaignTemplate template)
    {
        if (template == null) return BadRequest();
        template.Id = templateId;
        var ok = await _campaigns.UpdateTemplateAsync(template);
        return ok ? Ok(new { Success = true }) : NotFound();
    }

    // ── Kampanie ──

    /// <summary>Rozpocznij nową kampanię (instancję szablonu).</summary>
    [HttpPost("start")]
    public async Task<IActionResult> StartCampaign([FromBody] StartCampaignRequest req)
    {
        if (req == null) return BadRequest();
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        try
        {
            var campaign = await _campaigns.StartCampaignAsync(req.TemplateId, playerId.Value, req.CoopMode);
            return CreatedAtAction(nameof(GetCampaign), new { campaignId = campaign.Id }, campaign);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    /// <summary>Dołącz do kampanii coop.</summary>
    [HttpPost("{campaignId}/join")]
    public async Task<IActionResult> JoinCampaign(int campaignId)
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();
        var ok = await _campaigns.JoinCampaignAsync(campaignId, playerId.Value);
        return ok ? Ok(new { Success = true }) : BadRequest(new { Message = "Nie można dołączyć do kampanii" });
    }

    /// <summary>Pobierz szczegóły kampanii (z postępem rund).</summary>
    [HttpGet("{campaignId}")]
    public async Task<IActionResult> GetCampaign(int campaignId)
    {
        var campaign = await _campaigns.GetCampaignAsync(campaignId);
        return campaign != null ? Ok(campaign) : NotFound();
    }

    /// <summary>Pobierz kampanie gracza.</summary>
    [HttpGet("my")]
    public async Task<IActionResult> GetMyCampaigns()
    {
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();
        var campaigns = await _campaigns.GetPlayerCampaignsAsync(playerId.Value);
        return Ok(campaigns);
    }

    /// <summary>Wybierz piosenkę w rundzie kampanii.</summary>
    [HttpPost("{campaignId}/rounds/{roundNumber}/choose-song")]
    public async Task<IActionResult> ChooseSong(int campaignId, int roundNumber, [FromBody] int songId)
    {
        var rp = await _campaigns.ChooseSongAsync(campaignId, roundNumber, songId);
        return rp != null ? Ok(rp) : BadRequest(new { Message = "Nie można wybrać piosenki (runda zablokowana lub nie istnieje)" });
    }

    /// <summary>Zgłoś wynik śpiewania w rundzie kampanii.</summary>
    [HttpPost("{campaignId}/rounds/{roundNumber}/submit-score")]
    public async Task<IActionResult> SubmitRoundScore(int campaignId, int roundNumber, [FromBody] SubmitRoundScoreRequest req)
    {
        if (req == null) return BadRequest();
        var playerId = GetPlayerId();
        if (playerId == null) return Unauthorized();

        var rp = await _campaigns.SubmitRoundScoreAsync(campaignId, roundNumber, playerId.Value, req.Score, req.SingingId);
        return rp != null ? Ok(rp) : BadRequest(new { Message = "Nie można zgłosić wyniku" });
    }

    // ── Postęp gracza ──

    /// <summary>Pobierz postęp gracza (XP, poziomy we wszystkich kategoriach).</summary>
    [HttpGet("/api/karaoke/progress/{playerId}")]
    public async Task<IActionResult> GetPlayerProgress(int playerId)
    {
        var progress = await _progress.GetProgressAsync(playerId);
        return Ok(progress);
    }

    /// <summary>Pobierz odblokowane skille gracza.</summary>
    [HttpGet("/api/karaoke/progress/{playerId}/skills")]
    public async Task<IActionResult> GetPlayerSkills(int playerId)
    {
        var skills = await _progress.GetPlayerSkillsAsync(playerId);
        return Ok(skills);
    }

    /// <summary>Dodaj XP graczowi (admin/test).</summary>
    [HttpPost("/api/karaoke/progress/{playerId}/add-xp")]
    public async Task<IActionResult> AddXp(int playerId, [FromBody] AddXpRequest req)
    {
        if (req == null) return BadRequest();
        if (!User.IsInRole("Admin")) return Forbid();
        var result = await _progress.AddXpAsync(playerId, req.Category, req.Amount, req.Source ?? "admin");
        return Ok(new { result.NewXp, result.NewLevel, result.LeveledUp });
    }

    private int? GetPlayerId()
    {
        var uid = User.FindFirst("id")?.Value;
        return int.TryParse(uid, out var id) ? id : null;
    }
}
