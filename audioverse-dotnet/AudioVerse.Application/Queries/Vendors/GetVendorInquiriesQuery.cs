using AudioVerse.Domain.Entities.Vendors;
using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>List vendor inquiries (owner only).</summary>
public record GetVendorInquiriesQuery(int VendorProfileId, int OwnerUserId, VendorInquiryStatus? Status = null) : IRequest<IEnumerable<VendorInquiry>>;
