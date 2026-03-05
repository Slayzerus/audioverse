using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>Get vendor profile details by slug.</summary>
public record GetVendorProfileQuery(string Slug) : IRequest<VendorProfileDto?>;
