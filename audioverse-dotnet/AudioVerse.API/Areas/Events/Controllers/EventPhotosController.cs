using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Infrastructure.Storage;
using AudioVerse.API.Models.Requests.Events;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;

namespace AudioVerse.API.Areas.Events.Controllers
{
    /// <summary>
    /// Event photos — upload, thumbnails, filters, versions, tags.
    /// </summary>
    [ApiController]
    [Route("api/events")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Events - Photos")]
    public class EventPhotosController : ControllerBase
    {
        private readonly IMediator _mediator;

        public EventPhotosController(IMediator mediator) => _mediator = mediator;

        /// <summary>Upload a photo for an event (multipart form). Auto-generates thumbnail.</summary>
        [HttpPost("{eventId:int}/photos")]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        public async Task<IActionResult> AddPhoto(int eventId, IFormFile file, [FromForm] string? caption, [FromForm] int? userId, [FromForm] int? collectionId)
        {
            if (file == null || file.Length == 0) return BadRequest(new { Message = "File is required" });

            var fs = HttpContext.RequestServices.GetRequiredService<IFileStorage>();
            var bytes = new byte[file.Length];
            using (var s = file.OpenReadStream()) await s.ReadExactlyAsync(bytes);

            var guid = Guid.NewGuid();
            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".jpg";
            var key = $"events/{eventId}/{guid}{ext}";
            await fs.EnsureBucketExistsAsync("ev-photos");
            using (var ms = new MemoryStream(bytes))
                await fs.UploadAsync("ev-photos", key, ms, file.ContentType ?? "image/jpeg");

            string? thumbKey = null;
            try
            {
                using var thumbImage = Image.Load(bytes);
                thumbImage.Mutate(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size(200, 200),
                    Mode = ResizeMode.Max
                }));
                using var thumbMs = new MemoryStream();
                thumbImage.SaveAsPng(thumbMs);
                thumbMs.Position = 0;
                thumbKey = $"events/{eventId}/thumbs/{guid}.png";
                await fs.UploadAsync("ev-photos", thumbKey, thumbMs, "image/png");
            }
            catch { /* thumbnail generation failed — non-critical */ }

            int? finalCollectionId = collectionId;
            if (!finalCollectionId.HasValue)
            {
                var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IEventRepository>();
                var collections = await repo.GetMediaCollectionsByEventAsync(eventId);
                var first = collections.OrderBy(c => c.OrderNumber).FirstOrDefault();
                if (first != null)
                {
                    finalCollectionId = first.Id;
                }
                else
                {
                    var defaultCollection = new AudioVerse.Domain.Entities.Events.EventMediaCollection
                    {
                        EventId = eventId,
                        Name = "Photos",
                        OrderNumber = 0,
                        AccessLevel = AudioVerse.Domain.Entities.Events.EventMediaAccessLevel.Public,
                        CreatedAt = DateTime.UtcNow
                    };
                    finalCollectionId = await repo.AddMediaCollectionAsync(defaultCollection);
                }
            }

            var photo = new AudioVerse.Domain.Entities.Events.EventPhoto
            {
                EventId = eventId,
                ObjectKey = key,
                ThumbnailKey = thumbKey,
                Caption = caption,
                UploadedByUserId = userId,
                CollectionId = finalCollectionId
            };
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddEventPhotoCommand(photo));
            return Created($"/api/events/{eventId}/photos/{id}", new { Id = id, Key = key, ThumbnailKey = thumbKey, CollectionId = finalCollectionId });
        }

        /// <summary>Get photos for an event (returns thumbnail URLs for gallery view).</summary>
        [HttpGet("{eventId:int}/photos")]
        public async Task<IActionResult> GetPhotos(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventPhotosQuery(eventId)));

        /// <summary>Serve a photo image directly.</summary>
        [HttpGet("{eventId:int}/photos/{id:int}/image")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPhotoImage(int eventId, int id)
        {
            var photos = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventPhotosQuery(eventId));
            var photo = photos.FirstOrDefault(p => p.Id == id);
            if (photo == null) return NotFound();

            var fs = HttpContext.RequestServices.GetRequiredService<IFileStorage>();
            var stream = await fs.DownloadAsync("ev-photos", photo.ObjectKey);
            if (stream == null) return NotFound();

            var ext = Path.GetExtension(photo.ObjectKey)?.ToLowerInvariant();
            var ct = ext switch { ".png" => "image/png", ".webp" => "image/webp", ".gif" => "image/gif", _ => "image/jpeg" };
            return File(stream, ct);
        }

        /// <summary>Get version history of a photo (original + all filtered versions).</summary>
        [HttpGet("{eventId:int}/photos/{id:int}/versions")]
        public async Task<IActionResult> GetPhotoVersions(int eventId, int id)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventPhotoVersionsQuery(id)));

        /// <summary>Apply filters to an event photo. Creates a new version linked to the original.</summary>
        [HttpPost("{eventId:int}/photos/{id:int}/filter")]
        [ProducesResponseType(typeof(AudioVerse.Application.Commands.Events.ApplyFilterToEventPhotoResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ApplyPhotoFilter(int eventId, int id, [FromBody] ApplyEventPhotoFilterRequest request)
        {
            if (request.Filters == null || request.Filters.Length == 0)
                return BadRequest(new { Message = "At least one filter is required" });

            var result = await _mediator.Send(new AudioVerse.Application.Commands.Events.ApplyFilterToEventPhotoCommand(id, request.Filters, request.UserId));
            if (result == null) return NotFound();
            return Ok(result);
        }

        /// <summary>Preview a filter on an event photo without saving.</summary>
        [HttpGet("{eventId:int}/photos/{id:int}/filter/{filter}/preview")]
        [AllowAnonymous]
        public async Task<IActionResult> PreviewPhotoFilter(int eventId, int id, string filter, [FromQuery] int size = 512)
        {
            size = Math.Clamp(size, 32, 1024);
            var photos = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventPhotosQuery(eventId));
            var photo = photos.FirstOrDefault(p => p.Id == id);
            if (photo == null) return NotFound();

            var fs = HttpContext.RequestServices.GetRequiredService<IFileStorage>();
            var stream = await fs.DownloadAsync("ev-photos", photo.ObjectKey);
            if (stream == null) return NotFound();

            byte[] original;
            using (var ms = new MemoryStream()) { await stream.CopyToAsync(ms); original = ms.ToArray(); }
            var filtered = AudioVerse.Infrastructure.Storage.ImageFilterEngine.Apply(original, filter, size);
            return File(filtered, "image/png");
        }

        /// <summary>Delete a photo.</summary>
        [HttpDelete("{eventId:int}/photos/{id:int}")]
        public async Task<IActionResult> DeletePhoto(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteEventPhotoCommand(id)) ? NoContent() : NotFound();

        /// <summary>Serve photo thumbnail (200px).</summary>
        [HttpGet("{eventId:int}/photos/{id:int}/thumbnail")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPhotoThumbnail(int eventId, int id)
        {
            var photos = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetEventPhotosQuery(eventId));
            var photo = photos.FirstOrDefault(p => p.Id == id);
            if (photo == null || string.IsNullOrEmpty(photo.ThumbnailKey)) return NotFound();

            var fs = HttpContext.RequestServices.GetRequiredService<IFileStorage>();
            var stream = await fs.DownloadAsync("ev-photos", photo.ThumbnailKey);
            return stream != null ? File(stream, "image/png") : NotFound();
        }

        /// <summary>Tag a person on a photo (with coordinates).</summary>
        [HttpPost("{eventId:int}/photos/{photoId:int}/tags")]
        public async Task<IActionResult> AddPhotoTag(int eventId, int photoId, [FromBody] AudioVerse.Domain.Entities.Events.EventMediaTag tag)
        {
            tag.PhotoId = photoId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddEventMediaTagCommand(tag));
            return Created($"/api/events/{eventId}/photos/{photoId}/tags/{id}", new { Id = id });
        }

        /// <summary>Get tags on a photo.</summary>
        [HttpGet("{eventId:int}/photos/{photoId:int}/tags")]
        public async Task<IActionResult> GetPhotoTags(int eventId, int photoId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetPhotoTagsQuery(photoId)));

        /// <summary>Delete a tag from a photo.</summary>
        [HttpDelete("{eventId:int}/photos/{photoId:int}/tags/{tagId:int}")]
        public async Task<IActionResult> DeletePhotoTag(int eventId, int photoId, int tagId)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteEventMediaTagCommand(tagId)) ? NoContent() : NotFound();
    }
}
