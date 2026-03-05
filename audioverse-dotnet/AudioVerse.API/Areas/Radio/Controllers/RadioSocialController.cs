using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using AudioVerse.API.Models.Requests.Radio;

namespace AudioVerse.API.Areas.Radio.Controllers
{
    /// <summary>
    /// Radio social features — chat, song reactions, comments/reviews, follow/unfollow.
    /// </summary>
    [Route("api/radio")]
    [ApiController]
    public class RadioSocialController(IRadioRepository radio) : ControllerBase
    {
        // ── Chat ──

        /// <summary>Get recent chat messages for a station (public).</summary>
        [HttpGet("{id}/chat")]
        public async Task<IActionResult> GetChat(int id, [FromQuery] int limit = 50)
        {
            limit = Math.Clamp(limit, 1, 200);
            var messages = (await radio.GetChatMessagesAsync(id, limit, null))
                .Select(m => new { m.Id, m.DisplayName, m.Content, m.MessageType, m.SentAtUtc, m.UserId })
                .OrderBy(m => m.SentAtUtc);
            return Ok(messages);
        }

        /// <summary>Send a chat message to a station (authenticated).</summary>
        [Authorize]
        [HttpPost("{id}/chat")]
        public async Task<IActionResult> SendChatMessage(int id, [FromBody] ChatMessageRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content)) return BadRequest("Content is required");
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var msg = new RadioChatMessage
            {
                RadioStationId = id,
                UserId = userId,
                DisplayName = req.DisplayName ?? User.Identity?.Name ?? "Anonim",
                Content = req.Content,
                MessageType = "text"
            };
            await radio.AddChatMessageAsync(msg);
            return Ok(new { msg.Id, msg.SentAtUtc });
        }

        /// <summary>Delete a chat message (Admin / moderation).</summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}/chat/{messageId}")]
        public async Task<IActionResult> DeleteChatMessage(int id, int messageId)
        {
            var msg = await radio.GetChatMessageAsync(messageId, id);
            if (msg == null) return NotFound();
            msg.IsDeleted = true;
            await radio.SaveChangesAsync();
            return NoContent();
        }

        // ── Song Reactions ──

        /// <summary>Add a reaction to the currently playing song (like, love, fire, sad, laugh, clap).</summary>
        [Authorize]
        [HttpPost("{id}/reactions")]
        public async Task<IActionResult> AddReaction(int id, [FromBody] SongReactionRequest req)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var reaction = new RadioSongReaction
            {
                RadioStationId = id,
                TrackId = req.TrackId,
                ExternalTrackId = req.ExternalTrackId,
                UserId = userId,
                ReactionType = req.ReactionType ?? "like"
            };
            await radio.AddSongReactionAsync(reaction);
            return Ok(new { reaction.Id });
        }

        /// <summary>Get reaction summary for the station's current song.</summary>
        [HttpGet("{id}/reactions/summary")]
        public async Task<IActionResult> GetReactionsSummary(int id, [FromQuery] int? trackId = null, [FromQuery] string? externalTrackId = null)
        {
            if (!trackId.HasValue && string.IsNullOrEmpty(externalTrackId)) return Ok(new { });
            var summary = await radio.GetReactionStatsAsync(id, trackId);
            return Ok(summary);
        }

        // ── Comments / Reviews ──

        /// <summary>Get comments/reviews for a radio station (public).</summary>
        [HttpGet("{id}/comments")]
        public async Task<IActionResult> GetComments(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            pageSize = Math.Clamp(pageSize, 1, 100);
            var (items, total, avgRating) = await radio.GetCommentsAsync(id, page, pageSize);
            var mapped = items.Select(c => new { c.Id, c.DisplayName, c.Content, c.Rating, c.CreatedAtUtc, c.UserId });
            return Ok(new { items = mapped, total, averageRating = Math.Round(avgRating, 2) });
        }

        /// <summary>Add a comment / review for a station (authenticated).</summary>
        [Authorize]
        [HttpPost("{id}/comments")]
        public async Task<IActionResult> AddComment(int id, [FromBody] CommentRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Content)) return BadRequest("Content is required");
            if (req.Rating.HasValue && (req.Rating < 1 || req.Rating > 5)) return BadRequest("Rating must be 1-5");
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var comment = new RadioComment
            {
                RadioStationId = id,
                UserId = userId,
                DisplayName = req.DisplayName ?? User.Identity?.Name ?? "Anonim",
                Content = req.Content,
                Rating = req.Rating
            };
            await radio.AddCommentAsync(comment);
            return Ok(new { comment.Id });
        }

        /// <summary>Delete a comment (Admin / moderation).</summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}/comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int id, int commentId)
        {
            var c = await radio.GetCommentAsync(commentId, id);
            if (c == null) return NotFound();
            c.IsDeleted = true;
            await radio.SaveChangesAsync();
            return NoContent();
        }

        // ── Follow ──

        /// <summary>Follow a radio station.</summary>
        [Authorize]
        [HttpPost("{id}/follow")]
        public async Task<IActionResult> Follow(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var existing = await radio.GetFollowAsync(id, userId);
            if (existing != null) return Ok(new { alreadyFollowing = true });
            await radio.AddFollowAsync(new RadioFollow { RadioStationId = id, UserId = userId });
            return Ok(new { followed = true });
        }

        /// <summary>Unfollow a radio station.</summary>
        [Authorize]
        [HttpDelete("{id}/follow")]
        public async Task<IActionResult> Unfollow(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var existing = await radio.GetFollowAsync(id, userId);
            if (existing == null) return NotFound();
            await radio.RemoveFollowAsync(existing);
            return NoContent();
        }

        /// <summary>Follower count + whether the current user follows the station.</summary>
        [HttpGet("{id}/follow/status")]
        public async Task<IActionResult> FollowStatus(int id)
        {
            var count = await radio.GetFollowerCountAsync(id);
            bool isFollowing = false;
            var uidClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(uidClaim, out var uid))
                isFollowing = await radio.IsFollowingAsync(id, uid);
            return Ok(new { followers = count, isFollowing });
        }
    }
}
