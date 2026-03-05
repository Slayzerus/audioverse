using AudioVerse.Application.Commands.Social;
using AudioVerse.Application.Models.Requests.Social;
using AudioVerse.Application.Queries.Social;
using AudioVerse.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Identity.Controllers;

/// <summary>
/// Universal social features — ratings (with criteria), tags, comments, reactions, and user lists.
/// Works with any entity type via EntityType + EntityId polymorphism.
/// </summary>
[Route("api/social")]
[ApiController]
public class SocialController(IMediator mediator) : ControllerBase
{
    // ══════════════════════ RATINGS ══════════════════════

    /// <summary>Upsert a rating (one per player per entity). Score 1–10 with up to 3 criteria.</summary>
    [Authorize]
    [HttpPost("ratings")]
    public async Task<IActionResult> UpsertRating([FromBody] UpsertRatingRequest req)
    {
        if (!TryParseEntityType(req.EntityType, out var entityType))
            return BadRequest($"Unknown entityType: {req.EntityType}");

        var id = await mediator.Send(new UpsertRatingCommand(
            entityType, req.EntityId, req.PlayerId, req.OverallScore,
            ParseCriterion(req.Criterion1), req.Criterion1Score,
            ParseCriterion(req.Criterion2), req.Criterion2Score,
            ParseCriterion(req.Criterion3), req.Criterion3Score,
            req.ReviewText, req.ContainsSpoilers));

        return Ok(new { id });
    }

    /// <summary>Delete a rating.</summary>
    [Authorize]
    [HttpDelete("ratings/{ratingId}")]
    public async Task<IActionResult> DeleteRating(int ratingId, [FromQuery] int playerId)
        => await mediator.Send(new DeleteRatingCommand(ratingId, playerId)) ? Ok() : NotFound();

    /// <summary>Get ratings for an entity (paged).</summary>
    [HttpGet("ratings")]
    public async Task<IActionResult> GetRatings(
        [FromQuery] string entityType, [FromQuery] int entityId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!TryParseEntityType(entityType, out var et))
            return BadRequest($"Unknown entityType: {entityType}");

        var result = await mediator.Send(new GetRatingsQuery(et, entityId, page, pageSize));
        return Ok(new
        {
            result.TotalCount,
            page,
            pageSize,
            items = result.Items.Select(r => new
            {
                r.Id, r.PlayerId, playerName = r.Player?.Name,
                r.OverallScore,
                criterion1 = r.Criterion1?.ToString(), r.Criterion1Score,
                criterion2 = r.Criterion2?.ToString(), r.Criterion2Score,
                criterion3 = r.Criterion3?.ToString(), r.Criterion3Score,
                r.ReviewText, r.ContainsSpoilers,
                r.CreatedAtUtc, r.UpdatedAtUtc
            })
        });
    }

    /// <summary>Get aggregated rating summary for an entity.</summary>
    [HttpGet("ratings/aggregate")]
    public async Task<IActionResult> GetRatingAggregate(
        [FromQuery] string entityType, [FromQuery] int entityId)
    {
        if (!TryParseEntityType(entityType, out var et))
            return BadRequest($"Unknown entityType: {entityType}");

        var agg = await mediator.Send(new GetRatingAggregateQuery(et, entityId));
        return Ok(agg);
    }

    // ══════════════════════ TAGS ══════════════════════

    /// <summary>Add a tag to an entity.</summary>
    [Authorize]
    [HttpPost("tags")]
    public async Task<IActionResult> AddTag([FromBody] AddTagRequest req)
    {
        if (!TryParseEntityType(req.EntityType, out var entityType))
            return BadRequest($"Unknown entityType: {req.EntityType}");

        var id = await mediator.Send(new AddTagCommand(entityType, req.EntityId, req.PlayerId, req.Tag));
        return Ok(new { id });
    }

    /// <summary>Remove a tag.</summary>
    [Authorize]
    [HttpDelete("tags/{tagId}")]
    public async Task<IActionResult> RemoveTag(int tagId, [FromQuery] int playerId)
        => await mediator.Send(new RemoveTagCommand(tagId, playerId)) ? Ok() : NotFound();

    /// <summary>Get tag cloud for an entity (tag + usage count).</summary>
    [HttpGet("tags/cloud")]
    public async Task<IActionResult> GetTagCloud(
        [FromQuery] string entityType, [FromQuery] int entityId)
    {
        if (!TryParseEntityType(entityType, out var et))
            return BadRequest($"Unknown entityType: {entityType}");

        var result = await mediator.Send(new GetTagCloudQuery(et, entityId));
        return Ok(result);
    }

    // ══════════════════════ COMMENTS ══════════════════════

    /// <summary>Add a comment to an entity (supports threading via parentCommentId).</summary>
    [Authorize]
    [HttpPost("comments")]
    public async Task<IActionResult> AddComment([FromBody] AddCommentRequest req)
    {
        if (!TryParseEntityType(req.EntityType, out var entityType))
            return BadRequest($"Unknown entityType: {req.EntityType}");

        var id = await mediator.Send(new AddCommentCommand(
            entityType, req.EntityId, req.PlayerId, req.Content, req.ParentCommentId, req.ContainsSpoilers));
        return Ok(new { id });
    }

    /// <summary>Update a comment.</summary>
    [Authorize]
    [HttpPut("comments/{commentId}")]
    public async Task<IActionResult> UpdateComment(int commentId, [FromQuery] int playerId, [FromBody] UpdateCommentRequest req)
        => await mediator.Send(new UpdateCommentCommand(commentId, playerId, req.Content)) ? Ok() : NotFound();

    /// <summary>Delete a comment.</summary>
    [Authorize]
    [HttpDelete("comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(int commentId, [FromQuery] int playerId)
        => await mediator.Send(new DeleteCommentCommand(commentId, playerId)) ? Ok() : NotFound();

    /// <summary>Get comments for an entity (threaded, paged).</summary>
    [HttpGet("comments")]
    public async Task<IActionResult> GetComments(
        [FromQuery] string entityType, [FromQuery] int entityId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!TryParseEntityType(entityType, out var et))
            return BadRequest($"Unknown entityType: {entityType}");

        var result = await mediator.Send(new GetCommentsQuery(et, entityId, page, pageSize));
        return Ok(new
        {
            result.TotalCount,
            page,
            pageSize,
            items = result.Items.Select(MapComment)
        });
    }

    /// <summary>Toggle a reaction on a comment (add/remove).</summary>
    [Authorize]
    [HttpPost("comments/{commentId}/reactions")]
    public async Task<IActionResult> ToggleReaction(int commentId, [FromQuery] int playerId, [FromQuery] string reaction = "like")
    {
        var added = await mediator.Send(new ToggleCommentReactionCommand(commentId, playerId, reaction));
        return Ok(new { added });
    }

    // ══════════════════════ USER LISTS ══════════════════════

    /// <summary>Add an entity to a user's personal list (favorites, watchlist, etc.).</summary>
    [Authorize]
    [HttpPost("lists")]
    public async Task<IActionResult> AddToList([FromBody] AddToListRequest req)
    {
        if (!TryParseEntityType(req.EntityType, out var entityType))
            return BadRequest($"Unknown entityType: {req.EntityType}");

        var id = await mediator.Send(new AddToListCommand(entityType, req.EntityId, req.PlayerId, req.ListName, req.Note));
        return Ok(new { id });
    }

    /// <summary>Remove from a user's list.</summary>
    [Authorize]
    [HttpDelete("lists/{entryId}")]
    public async Task<IActionResult> RemoveFromList(int entryId, [FromQuery] int playerId)
        => await mediator.Send(new RemoveFromListCommand(entryId, playerId)) ? Ok() : NotFound();

    /// <summary>Get a player's list entries.</summary>
    [HttpGet("lists")]
    public async Task<IActionResult> GetPlayerList(
        [FromQuery] int playerId, [FromQuery] string listName, [FromQuery] string? entityType = null)
    {
        RateableEntityType? et = null;
        if (entityType != null)
        {
            if (!TryParseEntityType(entityType, out var parsed))
                return BadRequest($"Unknown entityType: {entityType}");
            et = parsed;
        }

        var result = await mediator.Send(new GetPlayerListQuery(playerId, listName, et));
        return Ok(result.Select(e => new
        {
            e.Id,
            entityType = e.EntityType.ToString(),
            e.EntityId,
            e.ListName,
            e.Note,
            e.SortOrder,
            e.CreatedAtUtc
        }));
    }

    // ── Helpers ──

    private static bool TryParseEntityType(string value, out RateableEntityType result)
        => Enum.TryParse(value, ignoreCase: true, out result);

    private static RatingCriterion? ParseCriterion(string? value)
        => value != null && Enum.TryParse<RatingCriterion>(value, ignoreCase: true, out var c) ? c : null;

    private static object MapComment(Domain.Entities.Social.UserComment c) => new
    {
        c.Id, c.PlayerId, playerName = c.Player?.Name,
        c.Content, c.ContainsSpoilers, c.IsEdited,
        c.ParentCommentId,
        c.CreatedAtUtc, c.UpdatedAtUtc,
        reactions = c.Reactions
            .GroupBy(r => r.ReactionType)
            .Select(g => new { type = g.Key, count = g.Count() }),
        replies = c.Replies.Select(MapComment)
    };
}
