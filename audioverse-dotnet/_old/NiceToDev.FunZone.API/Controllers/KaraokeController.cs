using Microsoft.AspNetCore.Mvc;
using NiceToDev.FunZone.Application.Interfaces;
using NiceToDev.FunZone.Domain.Entities;

namespace NiceToDev.FunZone.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KaraokeController : Controller
    {
        private readonly IKaraokeService _karaokeService;

        public KaraokeController(IKaraokeService karaokeService)
        {
            _karaokeService = karaokeService;
        }

        [HttpGet("get-song/{id}")]
        public async Task<IActionResult> GetSongById(int id)
        {
            var song = await _karaokeService.GetByIdAsync<KaraokeSongFile, KaraokeSongFile>(id);

            if (song == null)
                return NotFound(new { message = "Song not found" });

            // Pobieramy powiązane nuty
            var notes = await _karaokeService.GetAllAsync<KaraokeNote, KaraokeNote>();
            var songNotes = notes.Where(n => n.SongId == id).ToList();

            var response = new
            {
                song.Id,
                song.Title,
                song.Artist,
                song.Genre,
                song.Language,
                song.Year,
                song.CoverPath,
                song.AudioPath,
                song.VideoPath,
                Notes = songNotes
            };

            return Ok(response);
        }


        [HttpPost("create-party")]
        public async Task<IActionResult> CreateParty([FromBody] KaraokeParty party)
        {
            var createdParty = _karaokeService.Add<KaraokeParty, KaraokeParty>(party);
            return Ok(createdParty);
        }

        [HttpPost("create-player")]
        public async Task<IActionResult> CreatePlayer([FromBody] KaraokePlayer player)
        {
            var createdPlayer = _karaokeService.Add<KaraokePlayer, KaraokePlayer>(player);
            return Ok(createdPlayer);
        }

        [HttpPost("assign-player-to-party")]
        public async Task<IActionResult> AssignPlayerToParty([FromBody] KaraokePartyPlayer partyPlayer)
        {
            var assigned = _karaokeService.Add<KaraokePartyPlayer, KaraokePartyPlayer>(partyPlayer);
            return Ok(assigned);
        }

        [HttpPost("add-round")]
        public async Task<IActionResult> AddRound([FromBody] KaraokePartyRound round)
        {
            var createdRound = _karaokeService.Add<KaraokePartyRound, KaraokePartyRound>(round);
            return Ok(createdRound);
        }

        [HttpPost("add-song-to-round")]
        public async Task<IActionResult> AddSongToRound([FromBody] KaraokeSinging singing)
        {
            var createdSinging = _karaokeService.Add<KaraokeSinging, KaraokeSinging>(singing);
            return Ok(createdSinging);
        }

        [HttpPost("save-results")]
        public async Task<IActionResult> SaveResults([FromBody] List<KaraokeSinging> results)
        {
            _karaokeService.AddRange<KaraokeSinging, KaraokeSinging>(results);
            return Ok();
        }

        [HttpGet("get-party/{id}")]
        public async Task<IActionResult> GetParty(int id)
        {
            var party = await _karaokeService.GetByIdAsync<KaraokeParty, KaraokeParty>(id);
            if (party == null)
                return NotFound();
            return Ok(party);
        }

        [HttpGet("get-all-parties")]
        public async Task<IActionResult> GetAllParties()
        {
            var parties = await _karaokeService.GetAllAsync<KaraokeParty, KaraokeParty>();
            return Ok(parties);
        }

        [HttpGet("get-all-players")]
        public async Task<IActionResult> GetAllPlayers()
        {
            var players = await _karaokeService.GetAllAsync<KaraokePlayer, KaraokePlayer>();
            return Ok(players);
        }

        [HttpGet("filter-songs")]
        public async Task<IActionResult> FilterSongs([FromQuery] string? title, [FromQuery] string? artist, [FromQuery] string? genre, [FromQuery] string? language, [FromQuery] int? year)
        {
            var filteredSongs = await _karaokeService.FilterSongsAsync(s =>
                (string.IsNullOrEmpty(title) || s.Title.Contains(title)) &&
                (string.IsNullOrEmpty(artist) || s.Artist.Contains(artist)) &&
                (string.IsNullOrEmpty(genre) || s.Genre.Contains(genre)) &&
                (string.IsNullOrEmpty(language) || s.Language.Contains(language)) &&
                (!year.HasValue || s.Year == year.Value.ToString()));
            return Ok(filteredSongs);
        }

        [HttpPost("scan-folder")]
        public async Task<IActionResult> ScanFolder([FromQuery] string folderPath)
        {
            var songs = await _karaokeService.ScanFolderAsync(folderPath);
            _karaokeService.AddRange<KaraokeSongFile, KaraokeSongFile>(songs);
            return Ok(songs);
        }

        [HttpGet("get-cover")]
        public IActionResult GetCover([FromQuery] string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
            {
                return NotFound("File path is missing.");
            }

            // Zamiana rozszerzenia .txt na .jpg i .png
            string directory = Path.GetDirectoryName(filePath) ?? "";
            string fileNameWithoutExt = Path.GetFileNameWithoutExtension(filePath);

            string jpgPath = Path.Combine(directory, fileNameWithoutExt + ".jpg");
            string pngPath = Path.Combine(directory, fileNameWithoutExt + ".png");

            string? imagePath = null;

            // Sprawdzamy czy istnieje jpg lub png
            if (System.IO.File.Exists(jpgPath))
            {
                imagePath = jpgPath;
            }
            else if (System.IO.File.Exists(pngPath))
            {
                imagePath = pngPath;
            }

            // Jeśli nie znaleziono, zwracamy domyślną grafikę
            if (imagePath == null)
            {
                return Redirect("https://via.placeholder.com/100"); // Możesz zmienić na własną domyślną grafikę
            }

            // Zwracamy plik obrazu
            string mimeType = "image/jpeg";
            if (imagePath.EndsWith(".png"))
            {
                mimeType = "image/png";
            }

            return PhysicalFile(imagePath, mimeType);
        }

    }
}
