using MediatR;

namespace AudioVerse.Application.Queries.Vendors;

/// <summary>List available vendor service categories with vendor counts.</summary>
public record GetVendorCategoriesQuery() : IRequest<IEnumerable<VendorCategoryDto>>;
