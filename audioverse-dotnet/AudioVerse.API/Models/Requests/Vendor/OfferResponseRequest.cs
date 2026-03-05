using AudioVerse.Domain.Entities.Vendors;

namespace AudioVerse.API.Models.Requests.Vendor;

/// <summary>Request to accept/reject an offer.</summary>
public record OfferResponseRequest(bool Accept);
