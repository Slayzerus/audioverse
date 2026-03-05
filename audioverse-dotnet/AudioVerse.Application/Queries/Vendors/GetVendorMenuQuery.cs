using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>Get a vendor's menu — catering (public).</summary>
public record GetVendorMenuQuery(int VendorProfileId) : IRequest<IEnumerable<VendorMenuItem>>;
