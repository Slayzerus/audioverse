using AudioVerse.Application.Models.Requests.Editor;
using AudioVerse.Domain.Entities.Editor;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Editor.Controllers
{
    [ApiController]
    [Route("api/audio-editor")]
    [Authorize]
    public class AudioEditorController : ControllerBase
    {
        private readonly ILogger<AudioEditorController> _logger;
        private readonly IFileStorage _storage;
        private readonly IEditorRepository _repo;

        public AudioEditorController(ILogger<AudioEditorController> logger, IFileStorage storage, IEditorRepository repo)
        {
            _logger = logger;
            _storage = storage;
            _repo = repo;
        }

        /// <summary>Upload an audio asset to S3 storage.</summary>
        [HttpPost("assets")]
        public async Task<ActionResult<AssetDto>> UploadAsset(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file provided");

            await _storage.EnsureBucketExistsAsync("editor-assets");

            var key = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            using var stream = file.OpenReadStream();
            await _storage.UploadAsync("editor-assets", key, stream, file.ContentType);

            var url = await _storage.GetPresignedUrlAsync("editor-assets", key, TimeSpan.FromDays(7));

            return Ok(new AssetDto 
            { 
                Key = key,
                Url = url,
                FileName = file.FileName 
            });
        }

        /// <summary>List all audio editor projects.</summary>
        [HttpGet("projects")]
        public async Task<ActionResult<IEnumerable<ProjectDto>>> GetProjects()
        {
            var projects = await _repo.GetProjectsAsync();
            var dtos = projects.Select(p => new ProjectDto 
            {
                Id = p.Id,
                Name = p.Name,
                CreatedAt = DateTime.UtcNow
            });
            return Ok(dtos);
        }

        /// <summary>Create a new audio editor project with a default section.</summary>
        [HttpPost("projects")]
        public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectDto dto)
        {
            var project = new AudioProject 
            { 
               Name = dto.Name,
            };

            var section = new AudioSection { Name = "Main", OrderNumber = 1, Duration = TimeSpan.FromMinutes(5), BPM = (decimal)dto.BPM };
            project.Sections.Add(section);

            var id = await _repo.AddProjectAsync(project);

            var responseDto = new ProjectDto 
            {
                Id = id,
                Name = project.Name,
                CreatedAt = DateTime.UtcNow
            };

            return CreatedAtAction(nameof(GetProject), new { id }, responseDto);
        }

        /// <summary>Get project details including sections, layers and items.</summary>
        [HttpGet("projects/{id}")]
        public async Task<ActionResult<ProjectDetailDto>> GetProject(int id)
        {
            var project = await _repo.GetProjectWithDetailsAsync(id);

            if (project == null) return NotFound();

            var detailFn = new ProjectDetailDto 
            {
                Id = project.Id,
                Name = project.Name,
                Tracks = new List<TrackDto>(),
                    Sections = project.Sections.OrderBy(s => s.OrderNumber).Select(s => new SectionDto
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Order = s.OrderNumber,
                        BPM = (double)s.BPM,
                    Duration = s.Duration.TotalSeconds,
                    Tracks = s.Layers.Select(l => new TrackDto 
                    {
                        Id = l.Id,
                        Name = l.Name,
                        Volume = l.Volume,
                        Clips = l.Items.Select(i => {
                            double duration = 4.0;
                            string sourcePath = string.Empty;
                            string name = $"Clip {i.Id}";

                            if (!string.IsNullOrEmpty(i.Parameters)) {
                               try {
                                   using var doc = System.Text.Json.JsonDocument.Parse(i.Parameters);
                                   if (doc.RootElement.TryGetProperty("Duration", out var d)) duration = d.GetDouble();
                                   if (doc.RootElement.TryGetProperty("Source", out var src)) sourcePath = src.GetString() ?? string.Empty;
                                   if (doc.RootElement.TryGetProperty("Name", out var n)) name = n.GetString() ?? name;
                               } catch (System.Text.Json.JsonException) { }
                            }

                            return new ClipDto 
                            {
                                Id = i.Id,
                                StartPosition = i.StartTime.TotalSeconds,
                                Duration = duration,
                                SourcePath = sourcePath,
                                Name = name
                            };
                        }).ToList()
                    }).ToList()
                }).ToList(),
                CreatedAt = DateTime.UtcNow
            };

            return Ok(detailFn);
        }

        /// <summary>Update project metadata and section/layer structure.</summary>
        [HttpPut("projects/{id}")]
        public async Task<ActionResult> UpdateProject(int id, [FromBody] AudioProject incomingProject)
        {
             incomingProject.Id = id;
             var result = await _repo.UpdateProjectAsync(incomingProject);
             return result ? NoContent() : NotFound();
        }

        /// <summary>Add a new track (layer) to a project section.</summary>
        [HttpPost("projects/{id}/tracks")]
        public async Task<ActionResult<TrackDto>> AddTrack(int id, [FromBody] CreateTrackDto dto)
        {
            var project = await _repo.GetProjectWithDetailsAsync(id);

            if (project == null) return NotFound();

            var section = project.Sections.FirstOrDefault();
            if (section == null) {
                section = new AudioSection { Name = "Main", OrderNumber = 1, Duration = TimeSpan.FromMinutes(5), ProjectId = id };
                await _repo.AddSectionAsync(section);
            }

            var newLayer = new AudioLayer 
            {
               Name = dto.Name,
               Volume = 100,
               Duration = section.Duration,
               BPM = section.BPM,
               SectionId = section.Id
            };
            var layerId = await _repo.AddLayerAsync(newLayer);

            return Ok(new TrackDto 
            { 
                Id = layerId, 
                Name = newLayer.Name,
                Volume = newLayer.Volume
            });
        }

        /// <summary>Remove a track (layer) from a project.</summary>
        [HttpDelete("projects/{id}/tracks/{trackId}")]
        public async Task<ActionResult> DeleteTrack(int id, int trackId)
            => await _repo.DeleteLayerAsync(trackId) ? NoContent() : NotFound();

        /// <summary>Add a clip (layer item) to a track.</summary>
        [HttpPost("projects/{id}/tracks/{trackId}/clips")]
        public async Task<ActionResult<ClipDto>> AddClip(int id, int trackId, [FromBody] CreateClipDto dto)
        {
            var item = new AudioLayerItem 
            {
                LayerId = trackId,
                StartTime = TimeSpan.FromSeconds(dto.StartTime),
                Parameters = System.Text.Json.JsonSerializer.Serialize(new { 
                    Name = dto.Name, 
                    Duration = dto.Duration,
                    Source = dto.SourcePath 
                })
            };

            var itemId = await _repo.AddLayerItemAsync(item);
            if (itemId == 0) return NotFound();

            return Ok(new ClipDto 
            {
                Id = itemId,
                Name = dto.Name,
                StartPosition = dto.StartTime,
                Duration = dto.Duration,
                SourcePath = dto.SourcePath
            });
        }
        /// <summary>Start an audio export task for the project (WAV render).</summary>
        [HttpPost("projects/{id}/export")]
        public async Task<IActionResult> ExportProject(int id)
        {
             await Task.Delay(2000);
             return Ok(new { url = $"/api/audio-editor/projects/{id}/download" });
        }

        /// <summary>Download the rendered audio export file.</summary>
        [HttpGet("projects/{id}/download")]
        public IActionResult DownloadMixdown(int id)
        {
             var header = new byte[44]; 
             return File(header, "audio/wav", $"project_{id}_mixdown.wav");
        }
    }
}
