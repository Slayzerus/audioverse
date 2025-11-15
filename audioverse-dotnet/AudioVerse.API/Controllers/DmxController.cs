using AudioVerse.Application.Commands.DMX;
using AudioVerse.Application.Queries.DMX;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class DmxController : ControllerBase
    {
        private readonly IMediator _mediator;

        public DmxController(IMediator mediator) => _mediator = mediator;

        // GET api/dmx/state
        [HttpGet("state")]
        public async Task<ActionResult<DmxStateDto>> GetState(CancellationToken ct)
        {
            var dto = await _mediator.Send(new GetDmxStateQuery(), ct);
            return Ok(dto);
        }

        // GET api/dmx/devices
        // Zwraca IReadOnlyList<FtdiDeviceDto> (Twoja wersja z dodatkowym DmxDeviceInfo)
        [HttpGet("devices")]
        public async Task<ActionResult<IReadOnlyList<FtdiDeviceDto>>> GetDevices(CancellationToken ct)
        {
            var list = await _mediator.Send(new ListFtdiDevicesQuery(), ct);
            return Ok(list);
        }

        // POST api/dmx/port/open?id=...
        // lub body: { "id": "..." }
        public sealed record OpenReq(string? Id);

        [HttpPost("port/open")]
        public async Task<IActionResult> OpenPort([FromBody] OpenReq? body, [FromQuery] string? id, CancellationToken ct = default)
        {
            var target = body?.Id ?? id;
            await _mediator.Send(new OpenPortCommand(target), ct);
            return Ok(new { opened = true, id = target });
        }

        // POST api/dmx/port/close
        [HttpPost("port/close")]
        public async Task<IActionResult> ClosePort(CancellationToken ct)
        {
            await _mediator.Send(new ClosePortCommand(), ct);
            return Ok(new { opened = false });
        }

        // POST api/dmx/config
        // body: { "fps": 30, "startCode": 0 }
        public sealed record ConfigReq(int Fps, byte StartCode);

        [HttpPost("config")]
        public async Task<IActionResult> Configure([FromBody] ConfigReq req, CancellationToken ct)
        {
            await _mediator.Send(new ConfigureDmxCommand((uint)req.Fps, req.StartCode), ct);
            return Ok();
        }

        // PUT api/dmx/channel/1
        // body: { "value": 255 }
        public sealed record ChannelReq(byte Value);

        [HttpPut("channel/{ch:int}")]
        public async Task<IActionResult> SetChannel([FromRoute] int ch, [FromBody] ChannelReq req, CancellationToken ct)
        {
            await _mediator.Send(new SetChannelValueCommand(ch, req.Value), ct);
            return Ok(new { ch, value = req.Value });
        }

        // PUT api/dmx/universe
        // body: [0..255, ...] 512 elementów (kanały 1..512; StartCode ustawiasz osobno w configu)
        [HttpPut("universe")]
        public async Task<IActionResult> LoadUniverse([FromBody] byte[] payload512, CancellationToken ct)
        {
            await _mediator.Send(new LoadUniverseCommand(payload512), ct);
            return Ok();
        }

        // POST api/dmx/blackout
        [HttpPost("blackout")]
        public async Task<IActionResult> Blackout(CancellationToken ct)
        {
            await _mediator.Send(new BlackoutCommand(), ct);
            return Ok();
        }
    }
}
