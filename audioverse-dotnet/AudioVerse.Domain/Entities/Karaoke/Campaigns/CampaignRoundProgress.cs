using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;
using AudioVerse.Domain.Enums;

namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>
/// Postęp rundy w kampanii — wynik, wybrana piosenka, status odblokowania.
/// </summary>
public class CampaignRoundProgress
{
    public int Id { get; set; }
    public int CampaignId { get; set; }
    public Campaign? Campaign { get; set; }

    /// <summary>Numer rundy (1-based, odpowiada CampaignTemplateRound.RoundNumber).</summary>
    public int RoundNumber { get; set; }

    public CampaignRoundStatus Status { get; set; } = CampaignRoundStatus.Locked;

    /// <summary>Wybrana piosenka (z puli SongPool rundy szablonu).</summary>
    public int? ChosenSongId { get; set; }
    public KaraokeSongFile? ChosenSong { get; set; }

    /// <summary>Najlepszy wynik osiągnięty w tej rundzie (w trybie coop — zależnie od CoopMode).</summary>
    public int? BestScore { get; set; }

    /// <summary>Ile XP zdobyto za tę rundę.</summary>
    public int XpEarned { get; set; }

    public DateTime? CompletedAt { get; set; }

    /// <summary>Powiązanie z KaraokeSinging (faktyczny rekord śpiewania).</summary>
    public int? SingingId { get; set; }
}
