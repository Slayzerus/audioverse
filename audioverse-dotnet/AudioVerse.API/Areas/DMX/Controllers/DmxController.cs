using AudioVerse.Application.Commands.DMX;
using AudioVerse.Application.Queries.DMX;
using AudioVerse.API.Models.Requests.Dmx;
using AudioVerse.Domain.Entities.Dmx;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.DMX.Controllers
{
    /// <summary>
    /// DMX lighting control via FTDI USB interfaces.
    /// Control 512 DMX channels, manage scenes, and configure devices.
    /// </summary>
    [ApiController]
    [Route("api/dmx")]
    [Produces("application/json")]
    [Consumes("application/json")]
    [Tags("DMX Lighting")]
    [Authorize]
    public sealed class DmxController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IDmxRepository _dmxRepo;

        public DmxController(IMediator mediator, IDmxRepository dmxRepo)
        {
            _mediator = mediator;
            _dmxRepo = dmxRepo;
        }

        /// <summary>
        /// Get the current state of all 512 DMX channels.
        /// </summary>
        /// <returns>Complete DMX state with all channel values</returns>
        [HttpGet("state")]
        [ProducesResponseType(typeof(DmxStateDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<DmxStateDto>> GetState(CancellationToken ct)
        {
            var dto = await _mediator.Send(new GetDmxStateQuery(), ct);
            return Ok(dto);
        }

        /// <summary>
        /// Get list of available FTDI DMX devices/interfaces.
        /// </summary>
        /// <returns>List of connected FTDI DMX devices with serial numbers</returns>
        [HttpGet("devices")]
        [ProducesResponseType(typeof(IReadOnlyList<FtdiDeviceDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<IReadOnlyList<FtdiDeviceDto>>> GetDevices(CancellationToken ct)
        {
            var list = await _mediator.Send(new ListFtdiDevicesQuery(), ct);
            return Ok(list);
        }

        /// <summary>Open a DMX interface port.</summary>
        [HttpPost("port/open")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> OpenPort([FromBody] OpenReq? body, [FromQuery] string? id, CancellationToken ct = default)
        {
            var target = body?.Id ?? id;
            await _mediator.Send(new OpenPortCommand(target), ct);
            return Ok(new { opened = true, id = target });
        }

        /// <summary>
        /// Close the currently open DMX port.
        /// </summary>
        [HttpPost("port/close")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        public async Task<IActionResult> ClosePort(CancellationToken ct)
        {
            await _mediator.Send(new ClosePortCommand(), ct);
            return Ok(new { opened = false });
        }

        /// <summary>Configure DMX interface settings (FPS, start code).</summary>
        [HttpPost("config")]
        public async Task<IActionResult> Configure([FromBody] ConfigReq req, CancellationToken ct)
        {
            await _mediator.Send(new ConfigureDmxCommand((uint)req.Fps, req.StartCode), ct);
            return Ok();
        }

        /// <summary>
        /// Set a specific DMX channel to a value
        /// </summary>
        /// <param name="ch">DMX channel number (1-512)</param>
        /// <param name="req">Channel value (0-255)</param>
        /// <response code="200">Channel value set successfully</response>
        // PUT api/dmx/channel/1
        // body: { "value": 255 }
        /// <summary>Set a DMX channel value (0-255).</summary>
        [HttpPut("channel/{ch:int}")]
        public async Task<IActionResult> SetChannel([FromRoute] int ch, [FromBody] ChannelReq req, CancellationToken ct)
        {
            await _mediator.Send(new SetChannelValueCommand(ch, req.Value), ct);
            return Ok(new { ch, value = req.Value });
        }

        /// <summary>
        /// Load complete 512-channel DMX universe at once
        /// </summary>
        /// <param name="payload512">Array of 512 bytes (channels 1-512); StartCode is set separately via config</param>
        /// <response code="200">Universe loaded successfully</response>
        // PUT api/dmx/universe
        // body: [0..255, ...] 512 elementów (kanaly 1..512; StartCode ustawiasz osobno w configu)
        /// <summary>Load Universe.</summary>
        [HttpPut("universe")]
        public async Task<IActionResult> LoadUniverse([FromBody] byte[] payload512, CancellationToken ct)
        {
            await _mediator.Send(new LoadUniverseCommand(payload512), ct);
            return Ok();
        }

        /// <summary>
        /// Set all DMX channels to zero (blackout/all lights off)
        /// </summary>
        /// <response code="200">Blackout applied successfully</response>
        // POST api/dmx/blackout
        [HttpPost("blackout")]
        public async Task<IActionResult> Blackout(CancellationToken ct)
        {
            await _mediator.Send(new BlackoutCommand(), ct);
            return Ok();
        }

        // --------------------------------------------------
        //  SCENES
        // --------------------------------------------------

        /// <summary>List all saved scenes</summary>
        [HttpGet("scenes")]
        public async Task<IActionResult> GetScenes()
            => Ok(await _dmxRepo.GetAllScenesAsync());

        /// <summary>Create a scene (snapshot of channel values)</summary>
        [HttpPost("scenes")]
        public async Task<IActionResult> CreateScene([FromBody] DmxScene scene)
        {
            if (scene == null) return BadRequest();
            scene.CreatedAt = DateTime.UtcNow;
            var id = await _dmxRepo.SaveSceneAsync(scene);
            return CreatedAtAction(nameof(GetScenes), null, new { Id = id });
        }

        /// <summary>Delete a scene</summary>
        [HttpDelete("scenes/{id}")]
        public async Task<IActionResult> DeleteScene(int id)
            => await _dmxRepo.DeleteSceneAsync(id) ? NoContent() : NotFound();

        /// <summary>Apply a saved scene (write its channel values to DMX output)</summary>
        [HttpPost("scenes/{id}/apply")]
        public async Task<IActionResult> ApplyScene(int id, CancellationToken ct)
        {
            var scene = await _dmxRepo.GetSceneByIdAsync(id);
            if (scene == null) return NotFound();

            var channels = System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, byte>>(scene.ChannelValuesJson);
            if (channels != null)
            {
                foreach (var kv in channels)
                    await _mediator.Send(new SetChannelValueCommand(kv.Key, kv.Value), ct);
            }
            return Ok(new { Applied = scene.Name, Channels = channels?.Count ?? 0 });
        }

        // --------------------------------------------------
        //  SEQUENCES
        // --------------------------------------------------

        /// <summary>List all sequences</summary>
        [HttpGet("sequences")]
        public async Task<IActionResult> GetSequences()
            => Ok(await _dmxRepo.GetAllSequencesAsync());

        /// <summary>Create a sequence</summary>
        [HttpPost("sequences")]
        public async Task<IActionResult> CreateSequence([FromBody] DmxSceneSequence seq)
        {
            if (seq == null) return BadRequest();
            var id = await _dmxRepo.SaveSequenceAsync(seq);
            return CreatedAtAction(nameof(GetSequences), null, new { Id = id });
        }

        /// <summary>Delete a sequence</summary>
        [HttpDelete("sequences/{id}")]
        public async Task<IActionResult> DeleteSequence(int id)
            => await _dmxRepo.DeleteSequenceAsync(id) ? NoContent() : NotFound();

        /// <summary>Run a sequence (applies scenes in order with delays)</summary>
        [HttpPost("sequences/{id}/run")]
        public async Task<IActionResult> RunSequence(int id, CancellationToken ct)
        {
            var seq = await _dmxRepo.GetSequenceByIdAsync(id);
            if (seq == null) return NotFound();

            _ = Task.Run(async () =>
            {
                do
                {
                    foreach (var step in seq.Steps)
                    {
                        if (ct.IsCancellationRequested) return;
                        if (step.Scene == null) continue;

                        var channels = System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, byte>>(step.Scene.ChannelValuesJson);
                        if (channels != null)
                            foreach (var kv in channels)
                                await _mediator.Send(new SetChannelValueCommand(kv.Key, kv.Value), ct);

                        var totalDelay = step.HoldMs + step.FadeMs;
                        if (totalDelay > 0)
                            await Task.Delay(totalDelay, ct);
                    }
                } while (seq.Loop && !ct.IsCancellationRequested);
            }, ct);

            return Ok(new { Running = seq.Name, Steps = seq.Steps.Count, Loop = seq.Loop });
        }

        // --------------------------------------------------
        //  BEAT-REACTIVE DMX (6.2)
        // --------------------------------------------------

        /// <summary>Start beat-reactive mode: strobe scene on each beat interval based on BPM</summary>
        [HttpPost("beat-reactive/start")]
        public async Task<IActionResult> StartBeatReactive([FromBody] BeatReactiveRequest request, CancellationToken ct)
        {
            if (request == null || request.Bpm <= 0) return BadRequest(new { Message = "BPM must be > 0" });

            var scene = request.SceneId.HasValue
                ? await _dmxRepo.GetSceneByIdAsync(request.SceneId.Value)
                : (await _dmxRepo.GetAllScenesAsync()).FirstOrDefault();

            if (scene == null)
                return NotFound(new { Message = "No scene found. Create a scene first." });

            var intervalMs = (int)(60_000m / request.Bpm);
            var beats = request.Beats > 0 ? request.Beats : 16;

            _ = Task.Run(async () =>
            {
                var channels = System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, byte>>(scene.ChannelValuesJson);
                if (channels == null) return;

                for (int i = 0; i < beats && !ct.IsCancellationRequested; i++)
                {
                    // Flash on
                    foreach (var kv in channels)
                        await _mediator.Send(new SetChannelValueCommand(kv.Key, kv.Value), ct);

                    await Task.Delay(intervalMs / 2, ct);

                    // Flash off (blackout)
                    foreach (var kv in channels)
                        await _mediator.Send(new SetChannelValueCommand(kv.Key, 0), ct);

                    await Task.Delay(intervalMs / 2, ct);
                }
            }, ct);

            return Ok(new { Bpm = request.Bpm, IntervalMs = intervalMs, Beats = beats, SceneName = scene.Name });
        }

        /// <summary>Receive real-time beat tap from frontend audio analysis</summary>
        [HttpPost("beat-reactive/tap")]
        public async Task<IActionResult> BeatTap([FromBody] BeatTapRequest? request, CancellationToken ct)
        {
            var scene = request?.SceneId.HasValue == true
                ? await _dmxRepo.GetSceneByIdAsync(request.SceneId.Value)
                : (await _dmxRepo.GetAllScenesAsync()).FirstOrDefault();

            if (scene == null)
                return NotFound(new { Message = "No scene found" });

            var channels = System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, byte>>(scene.ChannelValuesJson);
            if (channels != null)
            {
                foreach (var kv in channels)
                    await _mediator.Send(new SetChannelValueCommand(kv.Key, kv.Value), ct);

                // Auto-off after 100ms
                _ = Task.Run(async () =>
                {
                    await Task.Delay(100, ct);
                    foreach (var kv in channels)
                        await _mediator.Send(new SetChannelValueCommand(kv.Key, 0), ct);
                }, ct);
            }

            return Ok(new { Tap = true });
        }
    }
}

