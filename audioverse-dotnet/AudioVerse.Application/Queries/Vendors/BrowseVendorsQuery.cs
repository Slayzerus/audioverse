using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>Browse vendors in the marketplace (filtering, pagination).</summary>
public record BrowseVendorsQuery(
    VendorServiceCategory? Category, string? City, string? Region, string? Country,
    string? Search, int Page = 1, int PageSize = 20) : IRequest<BrowseVendorsResult>;
