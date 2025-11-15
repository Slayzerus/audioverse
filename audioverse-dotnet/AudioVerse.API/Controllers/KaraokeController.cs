using MediatR;
using Microsoft.AspNetCore.Mvc;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Commands.Karaoke;
using Microsoft.AspNetCore.Http.HttpResults;

namespace AudioVerse.API.Controllers
{
    [ApiController]
    [Route("api/karaoke")]
    public class KaraokeController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<KaraokeController> _logger;

        public KaraokeController(IMediator mediator, ILogger<KaraokeController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        [HttpGet("get-song/{id}")]
        public async Task<IActionResult> GetSongById(int id)
        {
            KaraokeSongFile? song = await _mediator.Send(new GetSongByIdQuery(id));
            return song != null ? Ok(song) : NotFound(new { message = "Song not found" });
        }

        [HttpPost("create-party")]
        public async Task<IActionResult> CreateParty([FromBody] CreateKaraokePartyCommand command)
        {
            var partyId = await _mediator.Send(command);
            return Ok(new { PartyId = partyId });
        }

        [HttpPost("create-player")]
        public async Task<IActionResult> CreatePlayer([FromBody] CreateKaraokePlayerCommand command)
        {
            var playerId = await _mediator.Send(command);
            return Ok(new { PlayerId = playerId });
        }

        [HttpPost("assign-player-to-party")]
        public async Task<IActionResult> AssignPlayerToParty([FromBody] AssignPlayerToPartyCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }

        [HttpPost("add-round")]
        public async Task<IActionResult> AddRound([FromBody] AddKaraokeRoundCommand command)
        {
            var roundId = await _mediator.Send(command);
            return Ok(new { RoundId = roundId });
        }

        [HttpPost("add-song-to-round")]
        public async Task<IActionResult> AddSongToRound([FromBody] AddSongToRoundCommand command)
        {
            var singingId = await _mediator.Send(command);
            return Ok(new { SingingId = singingId });
        }

        [HttpPost("save-results")]
        public async Task<IActionResult> SaveResults([FromBody] List<SaveSingingResultsCommand> commands)
        {
            await _mediator.Send(new SaveSingingResultsBatchCommand(commands));
            return Ok();
        }

        [HttpGet("get-party/{id}")]
        public async Task<IActionResult> GetParty(int id)
        {
            var party = await _mediator.Send(new GetPartyByIdQuery(id));
            return party != null ? Ok(party) : NotFound();
        }

        [HttpGet("get-all-parties")]
        public async Task<IActionResult> GetAllParties()
        {
            var parties = await _mediator.Send(new GetAllPartiesQuery());
            return Ok(parties);
        }

        [HttpGet("get-all-players")]
        public async Task<IActionResult> GetAllPlayers()
        {
            var players = await _mediator.Send(new GetAllPlayersQuery());
            return Ok(players);
        }

        [HttpGet("filter-songs")]
        public async Task<IActionResult> FilterSongs([FromQuery] string? title, [FromQuery] string? artist, [FromQuery] string? genre, [FromQuery] string? language, [FromQuery] int? year)
        {
            var filteredSongs = await _mediator.Send(new FilterSongsQuery(title, artist, genre, language, year));
            return Ok(filteredSongs);
        }

        [HttpPost("scan-folder")]
        public async Task<IActionResult> ScanFolder([FromQuery] string folderPath)
        {
            var songs = await _mediator.Send(new ScanFolderCommand(folderPath));
            return Ok(songs);
        }

        [HttpPost("parse-ultrastar")]
        public async Task<IActionResult> ParseUltrastar([FromBody] ParseUltrastarFileCommand command)
        {
            Console.WriteLine($"Parsing Ultrastar file ({command.Data.Length})");
            var song = await _mediator.Send(command);
            return song != null ? Ok(song) : NotFound();
        }
    }
}
