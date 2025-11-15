using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NiceToDev.FunZone.Domain.Entities
{
    public class KaraokePartyRound
    {
        public int Id { get; set; }
        public int PartyId { get; set; }
        public KaraokeParty Party { get; set; } = null!;
        public int PlaylistId { get; set; }
        public KaraokePlaylist Playlist { get; set; } = null!;
        public int SongId { get; set; }
        public KaraokeSongFile Song { get; set; } = null!;
        public int PlayerId { get; set; }
        public KaraokePlayer Player { get; set; } = null!;
        public int Number { get; set; }
    }
}
