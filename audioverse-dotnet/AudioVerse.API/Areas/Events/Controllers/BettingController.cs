using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.API.Areas.Events.Controllers;

/// <summary>
/// Virtual currency betting on sports, games, karaoke, and other events.
/// Users wager from a virtual wallet pool and earn payouts on correct predictions.
/// </summary>
[ApiController]
[Route("api/betting")]
[Microsoft.AspNetCore.Authorization.Authorize]
[Produces("application/json")]
[Tags("Events - Betting")]
public class BettingController(IMediator mediator) : ControllerBase
{
    // ── Markets ──

    /// <summary>Get all betting markets for an event.</summary>
    [HttpGet("events/{eventId:int}/markets")]
    public async Task<IActionResult> GetMarketsByEvent(int eventId) =>
        Ok(await mediator.Send(new GetBettingMarketsByEventQuery(eventId)));

    /// <summary>Get a betting market by ID with options and bets.</summary>
    [HttpGet("markets/{id:int}")]
    public async Task<IActionResult> GetMarket(int id)
    {
        var market = await mediator.Send(new GetBettingMarketQuery(id));
        return market != null ? Ok(market) : NotFound();
    }

    /// <summary>Create a betting market for an event.</summary>
    [HttpPost("markets")]
    public async Task<IActionResult> CreateMarket([FromBody] BettingMarket market)
    {
        var id = await mediator.Send(new CreateBettingMarketCommand(market));
        return CreatedAtAction(nameof(GetMarket), new { id }, new { Id = id });
    }

    /// <summary>Add an option to a betting market.</summary>
    [HttpPost("markets/{marketId:int}/options")]
    public async Task<IActionResult> AddOption(int marketId, [FromBody] BettingOption option)
    {
        option.MarketId = marketId;
        var id = await mediator.Send(new AddBettingOptionCommand(option));
        return Ok(new { Id = id });
    }

    // ── Bets ──

    /// <summary>Place a bet on a market option (deducts from virtual wallet).</summary>
    [HttpPost("markets/{marketId:int}/bets")]
    public async Task<IActionResult> PlaceBet(int marketId, [FromQuery] int optionId, [FromQuery] int userId, [FromQuery] decimal amount, [FromQuery] int? leagueId = null)
    {
        var result = await mediator.Send(new PlaceBetCommand(marketId, optionId, userId, amount, leagueId));
        return result switch
        {
            > 0 => Ok(new { BetId = result }),
            -1 => BadRequest(new { error = "Insufficient virtual currency balance." }),
            _ => BadRequest(new { error = "Market closed or option not found." })
        };
    }

    /// <summary>Get a user's betting history.</summary>
    [HttpGet("users/{userId:int}/bets")]
    public async Task<IActionResult> GetUserBets(int userId, [FromQuery] int? leagueId = null) =>
        Ok(await mediator.Send(new GetUserBetsQuery(userId, leagueId)));

    // ── Wallet ──

    /// <summary>Get a user's virtual wallet balance.</summary>
    [HttpGet("users/{userId:int}/wallet")]
    public async Task<IActionResult> GetWallet(int userId, [FromQuery] int? leagueId = null) =>
        Ok(await mediator.Send(new GetWalletQuery(userId, leagueId)));

    // ── Resolution ──

    /// <summary>Resolve a betting market by selecting the winning option. Pays out winners automatically.</summary>
    [HttpPost("markets/{marketId:int}/resolve")]
    public async Task<IActionResult> ResolveMarket(int marketId, [FromQuery] int winningOptionId)
    {
        var payouts = await mediator.Send(new ResolveBettingMarketCommand(marketId, winningOptionId));
        return Ok(new { WinningOptionId = winningOptionId, PayoutsProcessed = payouts });
    }
}
