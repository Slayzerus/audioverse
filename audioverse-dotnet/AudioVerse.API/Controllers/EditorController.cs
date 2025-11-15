using AudioVerse.Application.Commands.Editor;
using AudioVerse.Application.Queries.Editor;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Controllers
{
    [ApiController]
    [Route("api/editor")]
    public class EditorController : ControllerBase
    {
        private readonly IMediator _mediator;

        public EditorController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // 🔹 Dodawanie projektu
        [HttpPost("project")]
        public async Task<IActionResult> AddProject([FromBody] AddProjectCommand command)
        {
            var projectId = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetProjectDetails), new { projectId }, projectId);
        }

        // 🔹 Dodawanie sekcji
        [HttpPost("section")]
        public async Task<IActionResult> AddSection([FromBody] AddSectionCommand command)
        {
            var sectionId = await _mediator.Send(command);
            return Ok(sectionId);
        }

        // 🔹 Dodawanie warstwy
        [HttpPost("layer")]
        public async Task<IActionResult> AddLayer([FromBody] AddLayerCommand command)
        {
            var layerId = await _mediator.Send(command);
            return Ok(layerId);
        }

        // 🔹 Dodawanie pojedynczego elementu warstwy
        [HttpPost("layer/item")]
        public async Task<IActionResult> AddLayerItem([FromBody] AddLayerItemCommand command)
        {
            var itemId = await _mediator.Send(command);
            return Ok(itemId);
        }

        // 🔹 Dodawanie wielu elementów warstwy
        [HttpPost("layer/items")]
        public async Task<IActionResult> AddLayerItems([FromBody] AddLayerItemsCommand command)
        {
            await _mediator.Send(command);
            return NoContent();
        }

        // 🔹 Pobieranie listy projektów
        [HttpGet("projects")]
        public async Task<IActionResult> GetProjects()
        {
            var projects = await _mediator.Send(new GetProjectsQuery());
            return Ok(projects);
        }
        
        // 🔹 Pobieranie listy projektów
        [HttpGet("projects/templates")]
        public async Task<IActionResult> GetProjectTemplates()
        {
            var projects = await _mediator.Send(new GetProjectTemplatesQuery());
            return Ok(projects);
        }

        // 🔹 Pobieranie szczegółów projektu
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetProjectDetails(int projectId)
        {
            var project = await _mediator.Send(new GetProjectDetailsQuery(projectId));
            if (project == null) return NotFound();
            return Ok(project);
        }

        // 🔹 Dodawanie AudioClip
        [HttpPost("audioclip")]
        public async Task<IActionResult> AddAudioClip([FromBody] AddAudioClipCommand command)
        {
            var clipId = await _mediator.Send(command);
            return Ok(clipId);
        }

        // 🔹 Pobieranie pojedynczego AudioClipu
        [HttpGet("audioclip/{clipId}")]
        public async Task<IActionResult> GetAudioClip(int clipId)
        {
            var clip = await _mediator.Send(new GetAudioClipQuery(clipId));
            if (clip == null) return NotFound();
            return Ok(clip);
        }

        // 🔹 Pobieranie listy AudioClipów (paginacja, wyszukiwanie, tag)
        [HttpGet("audioclips")]
        public async Task<IActionResult> GetAudioClips([FromQuery] int skip, [FromQuery] int take, [FromQuery] string? tag = null, [FromQuery] string? search = null)
        {
            var clips = await _mediator.Send(new GetAudioClipsQuery(skip, take, tag, search));
            return Ok(clips);
        }

        // 🔹 Dodawanie Input Presetu
        [HttpPost("inputpreset")]
        public async Task<IActionResult> AddInputPreset([FromBody] AddInputPresetCommand command)
        {
            var presetId = await _mediator.Send(command);
            return Ok(presetId);
        }

        // 🔹 Pobieranie pojedynczego Input Presetu
        [HttpGet("inputpreset/{presetId}")]
        public async Task<IActionResult> GetInputPreset(int presetId)
        {
            var preset = await _mediator.Send(new GetInputPresetQuery(presetId));
            if (preset == null) return NotFound();
            return Ok(preset);
        }

        // 🔹 Pobieranie listy Input Presetów (paginacja, wyszukiwanie)
        [HttpGet("inputpresets")]
        public async Task<IActionResult> GetInputPresets([FromQuery] int skip, [FromQuery] int take, [FromQuery] string? search = null)
        {
            var presets = await _mediator.Send(new GetInputPresetsQuery(skip, take, search));
            return Ok(presets);
        }

        // 🔹 Dodawanie tagu do AudioClip
        [HttpPost("audioclip/{clipId}/tag")]
        public async Task<IActionResult> AddTagToAudioClip(int clipId, [FromBody] string tag)
        {
            await _mediator.Send(new AddTagToAudioClipCommand(clipId, tag));
            return NoContent();
        }

        // 🔹 Usuwanie tagu z AudioClip
        [HttpDelete("audioclip/{clipId}/tag")]
        public async Task<IActionResult> RemoveTagFromAudioClip(int clipId, [FromBody] string tag)
        {
            await _mediator.Send(new RemoveTagFromAudioClipCommand(clipId, tag));
            return NoContent();
        }
    }
}
