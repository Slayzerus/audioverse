using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Application.Queries.Vendors;
using MediatR;
using System.Security.Claims;
using AudioVerse.API.Models.Requests.Vendor;
using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Areas.Vendor.Controllers;

/// <summary>
/// Vendor marketplace — company profiles, price lists, menus, portfolios, inquiries, offers, reviews.
/// Public browsing; management requires authentication (organization owner).
/// </summary>
[Route("api/vendors")]
[ApiController]
public class VendorController(IMediator mediator) : ControllerBase
{
    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // ══════════════════════ BROWSE / SEARCH ══════════════════════

    /// <summary>Browse vendors (marketplace) — filter by category, city, region, country. Paginated.</summary>
    [HttpGet]
    public async Task<IActionResult> Browse(
        [FromQuery] VendorServiceCategory? category = null, [FromQuery] string? city = null,
        [FromQuery] string? region = null, [FromQuery] string? country = null,
        [FromQuery] string? search = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new BrowseVendorsQuery(category, city, region, country, search, page, pageSize));
        return Ok(new { items = result.Items, total = result.Total, page = result.Page, pageSize = result.PageSize });
    }

    /// <summary>Available service categories in the marketplace with vendor counts.</summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
        => Ok(await mediator.Send(new GetVendorCategoriesQuery()));

    /// <summary>Vendor profile details by slug.</summary>
    [HttpGet("{slug}")]
    public async Task<IActionResult> GetProfile(string slug)
    {
        var result = await mediator.Send(new GetVendorProfileQuery(slug));
        return result != null ? Ok(result) : NotFound();
    }

    // ══════════════════════ VENDOR PROFILE MANAGEMENT ══════════════════════

    /// <summary>Create a vendor profile for an organization (organization owner).</summary>
    [Authorize]
    [HttpPost]
    public async Task<IActionResult> CreateProfile([FromBody] CreateVendorProfileRequest req)
    {
        try
        {
            var profile = await mediator.Send(new CreateVendorProfileCommand(
                req.OrganizationId, GetUserId(), req.Slug, req.ShortDescription, req.FullDescription,
                req.PrimaryCategory, req.AdditionalCategories,
                req.Phone, req.Email, req.Website, req.CoverImageUrl,
                req.City, req.Region, req.CountryCode, req.Latitude, req.Longitude, req.ServiceRadiusKm));
            return Ok(new { profile.Id, profile.Slug });
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    /// <summary>Update a vendor profile (owner).</summary>
    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateProfile(int id, [FromBody] CreateVendorProfileRequest req)
    {
        var result = await mediator.Send(new UpdateVendorProfileCommand(
            id, GetUserId(), req.Slug, req.ShortDescription, req.FullDescription,
            req.PrimaryCategory, req.AdditionalCategories,
            req.Phone, req.Email, req.Website, req.CoverImageUrl,
            req.City, req.Region, req.CountryCode, req.Latitude, req.Longitude, req.ServiceRadiusKm));
        return result != null ? Ok(result) : NotFound();
    }

    // ══════════════════════ PRICE LIST ══════════════════════

    /// <summary>Get vendor price list (public).</summary>
    [HttpGet("{vendorId:int}/pricelist")]
    public async Task<IActionResult> GetPriceList(int vendorId)
        => Ok(await mediator.Send(new GetVendorPriceListQuery(vendorId)));

    /// <summary>Add a price list item (owner).</summary>
    [Authorize]
    [HttpPost("{vendorId:int}/pricelist")]
    public async Task<IActionResult> AddPriceListItem(int vendorId, [FromBody] PriceListItemRequest req)
    {
        var item = await mediator.Send(new AddPriceListItemCommand(
            vendorId, GetUserId(), req.Name, req.Description, req.Category,
            req.Price, req.PriceFrom, req.PriceTo, req.Currency, req.PriceUnit,
            req.MinQuantity, req.ImageUrl, req.SortOrder));
        return item != null ? Ok(new { item.Id }) : Forbid();
    }

    /// <summary>Update a price list item (owner).</summary>
    [Authorize]
    [HttpPut("{vendorId:int}/pricelist/{itemId}")]
    public async Task<IActionResult> UpdatePriceListItem(int vendorId, int itemId, [FromBody] PriceListItemRequest req)
    {
        var item = await mediator.Send(new UpdatePriceListItemCommand(
            vendorId, itemId, GetUserId(), req.Name, req.Description, req.Category,
            req.Price, req.PriceFrom, req.PriceTo, req.Currency, req.PriceUnit,
            req.MinQuantity, req.ImageUrl, req.SortOrder, req.IsAvailable));
        return item != null ? Ok(item) : NotFound();
    }

    /// <summary>Delete a price list item (owner).</summary>
    [Authorize]
    [HttpDelete("{vendorId:int}/pricelist/{itemId}")]
    public async Task<IActionResult> RemovePriceListItem(int vendorId, int itemId)
        => await mediator.Send(new DeletePriceListItemCommand(vendorId, itemId, GetUserId())) ? NoContent() : (IActionResult)NotFound();

    // ══════════════════════ MENU ══════════════════════

    /// <summary>Get vendor menu (public — catering).</summary>
    [HttpGet("{vendorId:int}/menu")]
    public async Task<IActionResult> GetMenu(int vendorId)
        => Ok(await mediator.Send(new GetVendorMenuQuery(vendorId)));

    /// <summary>Add a menu item (owner).</summary>
    [Authorize]
    [HttpPost("{vendorId:int}/menu")]
    public async Task<IActionResult> AddMenuItem(int vendorId, [FromBody] MenuItemRequest req)
    {
        var item = await mediator.Send(new AddVendorMenuItemCommand(
            vendorId, GetUserId(), req.Name, req.Description, req.Category,
            req.Price, req.Currency, req.ImageUrl, req.Allergens,
            req.IsVegetarian, req.IsVegan, req.IsGlutenFree, req.SortOrder));
        return item != null ? Ok(new { item.Id }) : Forbid();
    }

    /// <summary>Update a menu item (owner).</summary>
    [Authorize]
    [HttpPut("{vendorId:int}/menu/{itemId}")]
    public async Task<IActionResult> UpdateMenuItem(int vendorId, int itemId, [FromBody] MenuItemRequest req)
    {
        var item = await mediator.Send(new UpdateVendorMenuItemCommand(
            vendorId, itemId, GetUserId(), req.Name, req.Description, req.Category,
            req.Price, req.Currency, req.ImageUrl, req.Allergens,
            req.IsVegetarian, req.IsVegan, req.IsGlutenFree, req.SortOrder, req.IsAvailable));
        return item != null ? Ok(item) : NotFound();
    }

    /// <summary>Delete a menu item (owner).</summary>
    [Authorize]
    [HttpDelete("{vendorId:int}/menu/{itemId}")]
    public async Task<IActionResult> RemoveMenuItem(int vendorId, int itemId)
        => await mediator.Send(new DeleteVendorMenuItemCommand(vendorId, itemId, GetUserId())) ? NoContent() : (IActionResult)NotFound();

    // ══════════════════════ PORTFOLIO ══════════════════════

    /// <summary>Vendor portfolio / gallery (public).</summary>
    [HttpGet("{vendorId:int}/portfolio")]
    public async Task<IActionResult> GetPortfolio(int vendorId)
        => Ok(await mediator.Send(new GetVendorPortfolioQuery(vendorId)));

    /// <summary>Add a portfolio item (owner).</summary>
    [Authorize]
    [HttpPost("{vendorId:int}/portfolio")]
    public async Task<IActionResult> AddPortfolioItem(int vendorId, [FromBody] PortfolioItemRequest req)
    {
        var item = await mediator.Send(new AddPortfolioItemCommand(vendorId, GetUserId(), req.Title, req.Description, req.ImageUrl, req.MediaType, req.SortOrder));
        return item != null ? Ok(new { item.Id }) : Forbid();
    }

    /// <summary>Delete a portfolio item (owner).</summary>
    [Authorize]
    [HttpDelete("{vendorId:int}/portfolio/{itemId}")]
    public async Task<IActionResult> RemovePortfolioItem(int vendorId, int itemId)
        => await mediator.Send(new DeletePortfolioItemCommand(vendorId, itemId, GetUserId())) ? NoContent() : (IActionResult)NotFound();

    // ══════════════════════ REVIEWS ══════════════════════

    /// <summary>Vendor reviews (public).</summary>
    [HttpGet("{vendorId:int}/reviews")]
    public async Task<IActionResult> GetReviews(int vendorId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetVendorReviewsQuery(vendorId, page, pageSize));
        return Ok(new { items = result.Items, total = result.Total });
    }

    /// <summary>Add a vendor review (authenticated).</summary>
    [Authorize]
    [HttpPost("{vendorId:int}/reviews")]
    public async Task<IActionResult> AddReview(int vendorId, [FromBody] ReviewRequest req)
    {
        try
        {
            var id = await mediator.Send(new AddVendorReviewCommand(vendorId, GetUserId(), req.Rating, req.Comment, req.EventId));
            return Ok(new { id });
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    // ══════════════════════ INQUIRIES ══════════════════════

    /// <summary>Send an inquiry to a vendor (public or authenticated).</summary>
    [HttpPost("{vendorId:int}/inquiries")]
    public async Task<IActionResult> SendInquiry(int vendorId, [FromBody] InquiryRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Message)) return BadRequest("Message is required");
        int? userId = int.TryParse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : null;
        var inquiry = await mediator.Send(new SendVendorInquiryCommand(
            vendorId, userId, req.ContactName, req.ContactEmail, req.ContactPhone,
            req.EventId, req.EventDate, req.GuestCount, req.Message, req.Budget, req.Currency));
        return Ok(new { inquiry.Id });
    }

    /// <summary>List vendor inquiries (owner).</summary>
    [Authorize]
    [HttpGet("{vendorId:int}/inquiries")]
    public async Task<IActionResult> ListInquiries(int vendorId, [FromQuery] VendorInquiryStatus? status = null)
        => Ok(await mediator.Send(new GetVendorInquiriesQuery(vendorId, GetUserId(), status)));

    /// <summary>Update inquiry status (owner).</summary>
    [Authorize]
    [HttpPatch("{vendorId:int}/inquiries/{inquiryId}/status")]
    public async Task<IActionResult> UpdateInquiryStatus(int vendorId, int inquiryId, [FromBody] UpdateStatusRequest req)
        => await mediator.Send(new UpdateInquiryStatusCommand(vendorId, inquiryId, GetUserId(), req.Status)) ? Ok() : NotFound();

    // ══════════════════════ OFFERS ══════════════════════

    /// <summary>Create an offer for a client (vendor owner).</summary>
    [Authorize]
    [HttpPost("{vendorId:int}/offers")]
    public async Task<IActionResult> CreateOffer(int vendorId, [FromBody] CreateOfferRequest req)
    {
        var items = req.Items?.Select(i => new OfferItemInput(i.Name, i.Description, i.PriceListItemId, i.MenuItemId, i.Quantity, i.UnitPrice, i.Notes, i.SortOrder)).ToList();
        var offer = await mediator.Send(new CreateVendorOfferCommand(
            vendorId, GetUserId(), req.InquiryId, req.ClientUserId, req.EventId,
            req.Title, req.Description, req.TotalPrice, req.Currency, req.ValidUntil, items));
        return offer != null ? Ok(new { offer.Id }) : Forbid();
    }

    /// <summary>Get an offer by ID (owner or client).</summary>
    [Authorize]
    [HttpGet("offers/{offerId}")]
    public async Task<IActionResult> GetOffer(int offerId)
    {
        var offer = await mediator.Send(new GetVendorOfferQuery(offerId, GetUserId()));
        return offer != null ? Ok(offer) : NotFound();
    }

    /// <summary>Send an offer to the client.</summary>
    [Authorize]
    [HttpPatch("offers/{offerId}/send")]
    public async Task<IActionResult> SendOffer(int offerId)
        => await mediator.Send(new SendVendorOfferCommand(offerId, GetUserId())) ? Ok() : NotFound();

    /// <summary>Client accepts or rejects an offer.</summary>
    [Authorize]
    [HttpPatch("offers/{offerId}/respond")]
    public async Task<IActionResult> RespondToOffer(int offerId, [FromBody] OfferResponseRequest req)
        => await mediator.Send(new RespondToOfferCommand(offerId, GetUserId(), req.Accept)) ? Ok() : NotFound();

    /// <summary>List vendor offers (owner).</summary>
    [Authorize]
    [HttpGet("{vendorId:int}/offers")]
    public async Task<IActionResult> ListOffers(int vendorId)
        => Ok(await mediator.Send(new GetVendorOffersQuery(vendorId, GetUserId())));

    /// <summary>My received offers (client).</summary>
    [Authorize]
    [HttpGet("offers/my")]
    public async Task<IActionResult> MyOffers()
        => Ok(await mediator.Send(new GetMyOffersQuery(GetUserId())));

    // ══════════════════════ EVENT VENDORS ══════════════════════

    /// <summary>Attach a vendor to an event (organizer).</summary>
    [Authorize]
    [HttpPost("event-vendors")]
    public async Task<IActionResult> AddEventVendor([FromBody] EventVendorRequest req)
    {
        var ev = await mediator.Send(new AddEventVendorCommand(req.EventId, req.VendorProfileId, req.ServiceCategory, req.AcceptedOfferId, req.Notes));
        return Ok(new { ev.Id });
    }

    /// <summary>List vendors attached to an event.</summary>
    [HttpGet("event-vendors/{eventId}")]
    public async Task<IActionResult> GetEventVendors(int eventId)
        => Ok(await mediator.Send(new GetEventVendorsQuery(eventId)));

    /// <summary>Update event-vendor status (confirm/reject) + accept offer.</summary>
    [Authorize]
    [HttpPatch("event-vendors/{id}/status")]
    public async Task<IActionResult> UpdateEventVendorStatus(int id, [FromBody] UpdateEventVendorStatusRequest req)
        => await mediator.Send(new UpdateEventVendorStatusCommand(id, req.Status, req.AcceptedOfferId)) ? Ok() : NotFound();
}
