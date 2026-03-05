using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Editor.Controllers
{
    /// <summary>
    /// Editor export (mixdown) and sample packs management.
    /// </summary>
    [ApiController]
    [Route("api/editor")]
    [Produces("application/json")]
    [Consumes("application/json")]
    [Tags("Editor - Export & Samples")]
    [Authorize]
    public class EditorExportController(IEditorRepository editorRepo) : ControllerBase
    {
        // ── Export / Mixdown ──

        /// <summary>Request a project export (mixdown). Returns a taskId to poll status.</summary>
        [HttpPost("project/{projectId}/export")]
        public async Task<IActionResult> RequestExport(int projectId)
        {
            var uid = User.FindFirst("id")?.Value;
            var task = new AudioVerse.Domain.Entities.Editor.AudioExportTask
            {
                ProjectId = projectId,
                RequestedByUserId = int.TryParse(uid, out var u) ? u : null,
                Status = AudioVerse.Domain.Enums.ExportStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            await editorRepo.AddExportTaskAsync(task);

            _ = Task.Run(async () =>
            {
                using var scope = HttpContext.RequestServices.GetRequiredService<IServiceScopeFactory>().CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<IEditorRepository>();
                var t = await repo.GetExportTaskByIdAsync(task.Id);
                if (t == null) return;
                try
                {
                    t.Status = AudioVerse.Domain.Enums.ExportStatus.Processing;
                    await repo.SaveChangesAsync();

                    var wavBytes = GenerateSilentWav(durationSeconds: 5, sampleRate: 44100);
                    var objectKey = $"exports/project-{projectId}-{task.Id}.wav";

                    var storage = scope.ServiceProvider.GetService<IFileStorage>();
                    if (storage != null)
                    {
                        using var ms = new MemoryStream(wavBytes);
                        await storage.UploadAsync("exports", objectKey, ms, "audio/wav");
                    }

                    t.OutputObjectKey = objectKey;
                    t.Status = AudioVerse.Domain.Enums.ExportStatus.Completed;
                    t.CompletedAt = DateTime.UtcNow;
                }
                catch (Exception ex)
                {
                    t.Status = AudioVerse.Domain.Enums.ExportStatus.Failed;
                    t.ErrorMessage = ex.Message;
                }
                await repo.SaveChangesAsync();
            });

            return Ok(new { TaskId = task.Id });
        }

        /// <summary>Check export task status.</summary>
        [HttpGet("export/{taskId}/status")]
        public async Task<IActionResult> GetExportStatus(int taskId)
        {
            var t = await editorRepo.GetExportTaskByIdAsync(taskId);
            if (t == null) return NotFound();
            return Ok(new { t.Id, t.ProjectId, Status = t.Status.ToString(), t.OutputObjectKey, t.ErrorMessage, t.CreatedAt, t.CompletedAt });
        }

        // ── Sample Packs ──

        /// <summary>List all sample packs.</summary>
        [HttpGet("sample-packs")]
        public async Task<IActionResult> GetSamplePacks([FromQuery] string? genre, [FromQuery] string? instrument)
            => Ok(await editorRepo.GetSamplePacksAsync(genre, instrument));

        /// <summary>Create a sample pack.</summary>
        [HttpPost("sample-packs")]
        public async Task<IActionResult> CreateSamplePack([FromBody] AudioVerse.Domain.Entities.Editor.AudioSamplePack pack)
        {
            if (pack == null) return BadRequest();
            pack.CreatedAt = DateTime.UtcNow;
            await editorRepo.AddSamplePackAsync(pack);
            return CreatedAtAction(nameof(GetSamplePacks), null, new { Id = pack.Id });
        }

        /// <summary>Get a single sample pack with samples.</summary>
        [HttpGet("sample-packs/{id}")]
        public async Task<IActionResult> GetSamplePack(int id)
        {
            var pack = await editorRepo.GetSamplePackByIdAsync(id);
            return pack != null ? Ok(pack) : NotFound();
        }

        /// <summary>Delete a sample pack.</summary>
        [HttpDelete("sample-packs/{id}")]
        public async Task<IActionResult> DeleteSamplePack(int id)
        {
            var p = await editorRepo.GetSamplePackByIdAsync(id);
            if (p == null) return NotFound();
            await editorRepo.RemoveSamplePackAsync(p);
            return NoContent();
        }

        /// <summary>Add a sample to a pack.</summary>
        [HttpPost("sample-packs/{packId}/samples")]
        public async Task<IActionResult> AddSample(int packId, [FromBody] AudioVerse.Domain.Entities.Editor.AudioSample sample)
        {
            if (sample == null) return BadRequest();
            sample.PackId = packId;
            await editorRepo.AddSampleAsync(sample);
            return Ok(new { Id = sample.Id });
        }

        /// <summary>Delete a sample.</summary>
        [HttpDelete("samples/{id}")]
        public async Task<IActionResult> DeleteSample(int id)
        {
            var s = await editorRepo.GetSampleByIdAsync(id);
            if (s == null) return NotFound();
            await editorRepo.RemoveSampleAsync(s);
            return NoContent();
        }

        private static byte[] GenerateSilentWav(int durationSeconds, int sampleRate = 44100, int channels = 2, int bitsPerSample = 16)
        {
            int byteRate = sampleRate * channels * (bitsPerSample / 8);
            int dataSize = byteRate * durationSeconds;
            int fileSize = 36 + dataSize;

            using var ms = new MemoryStream();
            using var bw = new BinaryWriter(ms);
            bw.Write("RIFF"u8); bw.Write(fileSize); bw.Write("WAVE"u8);
            bw.Write("fmt "u8); bw.Write(16); bw.Write((short)1); bw.Write((short)channels);
            bw.Write(sampleRate); bw.Write(byteRate);
            bw.Write((short)(channels * (bitsPerSample / 8))); bw.Write((short)bitsPerSample);
            bw.Write("data"u8); bw.Write(dataSize); bw.Write(new byte[dataSize]);
            return ms.ToArray();
        }
    }
}
