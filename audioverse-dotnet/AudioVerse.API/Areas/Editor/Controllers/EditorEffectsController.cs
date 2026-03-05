using AudioVerse.Application.Commands.Editor;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Editor.Controllers
{
    /// <summary>
    /// Editor effects, clip tags, and project collaborators.
    /// </summary>
    [ApiController]
    [Route("api/editor")]
    [Produces("application/json")]
    [Consumes("application/json")]
    [Tags("Editor - Effects & Collaboration")]
    [Authorize]
    public class EditorEffectsController(IMediator mediator, IEditorRepository editorRepo) : ControllerBase
    {
        // ── Clip Tags ──

        /// <summary>Add a tag to an audio clip for categorization.</summary>
        [HttpPost("audioclip/{clipId}/tag")]
        public async Task<IActionResult> AddTagToAudioClip(int clipId, [FromBody] string tag)
        {
            await mediator.Send(new AddTagToAudioClipCommand(clipId, tag));
            return NoContent();
        }

        /// <summary>Remove a tag from an audio clip.</summary>
        [HttpDelete("audioclip/{clipId}/tag")]
        public async Task<IActionResult> RemoveTagFromAudioClip(int clipId, [FromBody] string tag)
        {
            await mediator.Send(new RemoveTagFromAudioClipCommand(clipId, tag));
            return NoContent();
        }

        // ── Audio Effects ──

        /// <summary>List all available audio effects.</summary>
        [HttpGet("effects")]
        public async Task<IActionResult> GetEffects()
            => Ok(await editorRepo.GetEffectsAsync());

        /// <summary>Create a reusable audio effect preset.</summary>
        [HttpPost("effects")]
        public async Task<IActionResult> CreateEffect([FromBody] AudioVerse.Domain.Entities.Editor.AudioEffect effect)
        {
            if (effect == null) return BadRequest();
            await editorRepo.AddEffectAsync(effect);
            return CreatedAtAction(nameof(GetEffects), null, new { Id = effect.Id });
        }

        /// <summary>Update an audio effect.</summary>
        [HttpPut("effects/{id}")]
        public async Task<IActionResult> UpdateEffect(int id, [FromBody] AudioVerse.Domain.Entities.Editor.AudioEffect effect)
        {
            if (effect == null) return BadRequest();
            var e = await editorRepo.GetEffectByIdAsync(id);
            if (e == null) return NotFound();
            e.Name = effect.Name; e.Type = effect.Type; e.ParametersJson = effect.ParametersJson;
            await editorRepo.SaveChangesAsync();
            return Ok(new { Success = true });
        }

        /// <summary>Delete an audio effect.</summary>
        [HttpDelete("effects/{id}")]
        public async Task<IActionResult> DeleteEffect(int id)
        {
            var e = await editorRepo.GetEffectByIdAsync(id);
            if (e == null) return NotFound();
            await editorRepo.RemoveEffectAsync(e);
            return NoContent();
        }

        /// <summary>Assign an effect to an audio layer (with order and optional param overrides).</summary>
        [HttpPost("layers/{layerId}/effects")]
        public async Task<IActionResult> AddEffectToLayer(int layerId, [FromBody] AudioVerse.Domain.Entities.Editor.AudioLayerEffect layerEffect)
        {
            if (layerEffect == null) return BadRequest();
            layerEffect.LayerId = layerId;
            await editorRepo.AddLayerEffectAsync(layerEffect);
            return Ok(new { Id = layerEffect.Id });
        }

        /// <summary>List effects on a layer (ordered).</summary>
        [HttpGet("layers/{layerId}/effects")]
        public async Task<IActionResult> GetLayerEffects(int layerId)
            => Ok(await editorRepo.GetLayerEffectsAsync(layerId));

        /// <summary>Remove an effect from a layer.</summary>
        [HttpDelete("layer-effects/{id}")]
        public async Task<IActionResult> RemoveLayerEffect(int id)
        {
            var e = await editorRepo.GetLayerEffectByIdAsync(id);
            if (e == null) return NotFound();
            await editorRepo.RemoveLayerEffectAsync(e);
            return NoContent();
        }

        // ── Collaborators ──

        /// <summary>List collaborators for a project.</summary>
        [HttpGet("project/{projectId}/collaborators")]
        public async Task<IActionResult> GetCollaborators(int projectId)
            => Ok(await editorRepo.GetCollaboratorsAsync(projectId));

        /// <summary>Add a collaborator to a project.</summary>
        [HttpPost("project/{projectId}/collaborators")]
        public async Task<IActionResult> AddCollaborator(int projectId, [FromBody] AudioVerse.Domain.Entities.Editor.AudioProjectCollaborator collab)
        {
            if (collab == null) return BadRequest();
            collab.ProjectId = projectId;
            collab.JoinedAt = DateTime.UtcNow;
            await editorRepo.AddCollaboratorAsync(collab);
            return Ok(new { Id = collab.Id });
        }

        /// <summary>Update collaborator permission.</summary>
        [HttpPut("project/{projectId}/collaborators/{id}")]
        public async Task<IActionResult> UpdateCollaborator(int projectId, int id, [FromBody] AudioVerse.Domain.Entities.Editor.AudioProjectCollaborator collab)
        {
            if (collab == null) return BadRequest();
            var e = await editorRepo.GetCollaboratorByIdAsync(id);
            if (e == null || e.ProjectId != projectId) return NotFound();
            e.Permission = collab.Permission;
            await editorRepo.SaveChangesAsync();
            return Ok(new { Success = true });
        }

        /// <summary>Remove collaborator from project.</summary>
        [HttpDelete("project/{projectId}/collaborators/{id}")]
        public async Task<IActionResult> RemoveCollaborator(int projectId, int id)
        {
            var e = await editorRepo.GetCollaboratorByIdAsync(id);
            if (e == null || e.ProjectId != projectId) return NotFound();
            await editorRepo.RemoveCollaboratorAsync(e);
            return NoContent();
        }
    }
}
