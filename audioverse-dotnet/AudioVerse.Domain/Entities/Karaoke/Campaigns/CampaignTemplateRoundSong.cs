using AudioVerse.Domain.Entities.Karaoke.KaraokeSongFiles;

namespace AudioVerse.Domain.Entities.Karaoke.Campaigns;

/// <summary>Piosenka w puli do wyboru dla danej rundy szablonu kampanii.</summary>
public class CampaignTemplateRoundSong
{
    public int Id { get; set; }
    public int TemplateRoundId { get; set; }
    public CampaignTemplateRound? TemplateRound { get; set; }

    public int SongId { get; set; }
    public KaraokeSongFile? Song { get; set; }
}
