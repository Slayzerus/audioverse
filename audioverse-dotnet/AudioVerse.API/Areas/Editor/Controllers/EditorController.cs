using AudioVerse.Application.Commands.Editor;
using AudioVerse.Application.Queries.Editor;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Editor.Controllers
{
    /// <summary>
    /// Karaoke editor — audio projects, sections, layers, clips, and input presets.
    /// </summary>
    [ApiController]
    [Route("api/editor")]
    [Produces("application/json")]
    [Consumes("application/json")]
    [Tags("Editor")]
    [Authorize]
    public class EditorController(IMediator mediator, IEditorRepository editorRepo, IFileStorage? fileStorage = null) : ControllerBase
    {

        // ------------------------------------------------------------
        //  PROJECTS
        // ------------------------------------------------------------

        /// <summary>
        /// Create a new audio project.
        /// </summary>
        /// <param name="command">Project details (name, description)</param>
        /// <returns>Created project ID</returns>
        [HttpPost("project")]
        [ProducesResponseType(typeof(int), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> AddProject([FromBody] AddProjectCommand command)
        {
            var projectId = await mediator.Send(command);
            return CreatedAtAction(nameof(GetProjectDetails), new { projectId }, projectId);
        }

        /// <summary>
        /// Update a project.
        /// </summary>
        /// <param name="id">Project ID</param>
        /// <param name="command">Updated project data</param>
        [HttpPut("project/{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectCommand command)
        {
            if (id != command.Id) return BadRequest(new { Success = false, Message = "Id mismatch" });
            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Project not found" });
        }

        /// <summary>
        /// Delete a project.
        /// </summary>
        /// <param name="id">Project ID</param>
        [HttpDelete("project/{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var result = await mediator.Send(new DeleteProjectCommand(id));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Project not found" });
        }

        // ------------------------------------------------------------
        //  SECTIONS
        // ------------------------------------------------------------

        /// <summary>
        /// Add a new section to a project.
        /// </summary>
        /// <param name="command">Section details</param>
        /// <returns>Created section ID</returns>
        [HttpPost("section")]
        [ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
        public async Task<IActionResult> AddSection([FromBody] AddSectionCommand command)
        {
            var sectionId = await mediator.Send(command);
            return Ok(sectionId);
        }

        /// <summary>
        /// Update a section.
        /// </summary>
        /// <param name="id">Section ID</param>
        /// <param name="command">Updated section data</param>
        [HttpPut("section/{id:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateSection(int id, [FromBody] UpdateSectionCommand command)
        {
            if (id != command.Id) return BadRequest(new { Success = false, Message = "Id mismatch" });
            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Section not found" });
        }

        /// <summary>
        /// Delete section
        /// </summary>
        [HttpDelete("section/{id}")]
        public async Task<IActionResult> DeleteSection(int id)
        {
            var result = await mediator.Send(new DeleteSectionCommand(id));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Section not found" });
        }

        /// <summary>
        /// Add a new layer to a project section
        /// </summary>
        /// <param name="command">Layer details</param>
        /// <response code="200">Layer added successfully</response>
        [HttpPost("layer")]
        public async Task<IActionResult> AddLayer([FromBody] AddLayerCommand command)
        {
            var layerId = await mediator.Send(command);
            return Ok(layerId);
        }

        /// <summary>
        /// Update layer
        /// </summary>
        [HttpPut("layer/{id}")]
        public async Task<IActionResult> UpdateLayer(int id, [FromBody] UpdateLayerCommand command)
        {
            if (id != command.Id) return BadRequest(new { Success = false, Message = "Id mismatch" });
            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Layer not found" });
        }

        /// <summary>
        /// Delete layer
        /// </summary>
        [HttpDelete("layer/{id}")]
        public async Task<IActionResult> DeleteLayer(int id)
        {
            var result = await mediator.Send(new DeleteLayerCommand(id));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Layer not found" });
        }

        /// <summary>
        /// Add a single item to a layer
        /// </summary>
        /// <param name="command">Layer item details</param>
        /// <response code="200">Item added successfully</response>
        [HttpPost("layer/item")]
        public async Task<IActionResult> AddLayerItem([FromBody] AddLayerItemCommand command)
        {
            var itemId = await mediator.Send(command);
            return Ok(itemId);
        }

        /// <summary>
        /// Delete a single layer item
        /// </summary>
        [HttpDelete("layer/item/{id}")]
        public async Task<IActionResult> DeleteLayerItem(int id)
        {
            var result = await mediator.Send(new DeleteLayerItemCommand(id));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Layer item not found" });
        }

        /// <summary>
        /// Add multiple items to a layer in bulk
        /// </summary>
        /// <param name="command">List of layer items to add</param>
        /// <response code="204">Items added successfully</response>
        [HttpPost("layer/items")]
        public async Task<IActionResult> AddLayerItems([FromBody] AddLayerItemsCommand command)
        {
            await mediator.Send(command);
            return NoContent();
        }

        /// <summary>
        /// Get list of all projects with basic information
        /// </summary>
        /// <response code="200">List of projects</response>
        [HttpGet("projects")]
        public async Task<IActionResult> GetProjects()
        {
            var projects = await mediator.Send(new GetProjectsQuery());
            return Ok(projects);
        }
        
        /// <summary>
        /// Get available project templates
        /// </summary>
        /// <response code="200">List of project templates</response>
        [HttpGet("projects/templates")]
        public async Task<IActionResult> GetProjectTemplates()
        {
            var projects = await mediator.Send(new GetProjectTemplatesQuery());
            return Ok(projects);
        }

        /// <summary>
        /// Get complete project details with all sections and layers
        /// </summary>
        /// <param name="projectId">Project ID</param>
        /// <response code="200">Complete project details</response>
        /// <response code="404">Project not found</response>
        /// <summary>Get Project Details.</summary>
        [HttpGet("project/{projectId}")]
        public async Task<IActionResult> GetProjectDetails(int projectId)
        {
            var project = await mediator.Send(new GetProjectDetailsQuery(projectId));
            if (project == null) return NotFound();
            return Ok(project);
        }

        /// <summary>
        /// Upload or create an audio clip for the project
        /// </summary>
        /// <param name="command">Audio clip details and data</param>
        /// <response code="200">Audio clip created successfully</response>
        [HttpPost("audioclip")]
        public async Task<IActionResult> AddAudioClip([FromBody] AddAudioClipCommand command)
        {
            var clipId = await mediator.Send(command);
            return Ok(clipId);
        }

        /// <summary>
        /// Delete audio clip
        /// </summary>
        [HttpDelete("audioclip/{id}")]
        public async Task<IActionResult> DeleteAudioClip(int id)
        {
            var result = await mediator.Send(new DeleteAudioClipCommand(id));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false, Message = "Audio clip not found" });
        }

        /// <summary>
        /// Get a specific audio clip by ID
        /// </summary>
        /// <param name="clipId">Audio clip ID</param>
        /// <response code="200">Audio clip details</response>
        /// <response code="404">Audio clip not found</response>
        /// <summary>Get Audio Clip.</summary>
        [HttpGet("audioclip/{clipId}")]
        public async Task<IActionResult> GetAudioClip(int clipId)
        {
            var clip = await mediator.Send(new GetAudioClipQuery(clipId));
            if (clip == null) return NotFound();
            return Ok(clip);
        }

        /// <summary>
        /// Stream audio clip data from object storage
        /// </summary>
        /// <param name="id">Audio clip ID</param>
        /// <response code="200">Audio stream</response>
        /// <response code="404">Clip or storage object not found</response>
        /// <summary>Stream Audio Clip.</summary>
        [HttpGet("audioclip/{id}/stream")]
        [Produces("application/octet-stream")]
        public async Task<IActionResult> StreamAudioClip(int id)
        {
            var clip = await mediator.Send(new GetAudioClipQuery(id));
            if (clip == null) return NotFound();
            if (string.IsNullOrEmpty(clip.ObjectKey) || fileStorage == null)
                return NotFound(new { Success = false, Message = "Audio data not available" });

            var stream = await fileStorage.DownloadAsync("audio-clips", clip.ObjectKey);
            if (stream == null) return NotFound(new { Success = false, Message = "Storage object not found" });

            var contentType = clip.FileFormat switch
            {
                "mp3" => "audio/mpeg",
                "wav" => "audio/wav",
                "ogg" => "audio/ogg",
                "flac" => "audio/flac",
                _ => "application/octet-stream"
            };
            return File(stream, contentType, clip.FileName);
        }

        /// <summary>
        /// Get list of audio clips with pagination, filtering, and search
        /// </summary>
        /// <param name="skip">Number of records to skip</param>
        /// <param name="take">Number of records to return</param>
        /// <param name="tag">Filter by tag (optional)</param>
        /// <param name="search">Search by title or description (optional)</param>
        /// <response code="200">List of audio clips</response>
        /// <summary>Get Audio Clips.</summary>
        [HttpGet("audioclips")]
        public async Task<IActionResult> GetAudioClips([FromQuery] int skip, [FromQuery] int take, [FromQuery] string? tag = null, [FromQuery] string? search = null)
        {
            var clips = await mediator.Send(new GetAudioClipsQuery(skip, take, tag, search));
            return Ok(clips);
        }

        /// <summary>
        /// Create a new input preset for audio processing
        /// </summary>
        /// <param name="command">Preset configuration details</param>
        /// <response code="200">Input preset created successfully</response>
        [HttpPost("inputpreset")]
        public async Task<IActionResult> AddInputPreset([FromBody] AddInputPresetCommand command)
        {
            var presetId = await mediator.Send(command);
            return Ok(presetId);
        }

        /// <summary>
        /// Get a specific input preset by ID
        /// </summary>
        /// <param name="presetId">Preset ID</param>
        /// <response code="200">Preset details</response>
        /// <response code="404">Preset not found</response>
        /// <summary>Get Input Preset.</summary>
        [HttpGet("inputpreset/{presetId}")]
        public async Task<IActionResult> GetInputPreset(int presetId)
        {
            var preset = await mediator.Send(new GetInputPresetQuery(presetId));
            if (preset == null) return NotFound();
            return Ok(preset);
        }

        /// <summary>
        /// Get list of input presets with pagination and search
        /// </summary>
        /// <param name="skip">Number of records to skip</param>
        /// <param name="take">Number of records to return</param>
        /// <param name="search">Search by name (optional)</param>
        /// <response code="200">List of input presets</response>
        /// <summary>Get Input Presets.</summary>
        [HttpGet("inputpresets")]
        public async Task<IActionResult> GetInputPresets([FromQuery] int skip, [FromQuery] int take, [FromQuery] string? search = null)
        {
            var presets = await mediator.Send(new GetInputPresetsQuery(skip, take, search));
            return Ok(presets);
        }
    }
}
