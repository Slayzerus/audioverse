namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Status of a vendor inquiry in the marketplace.
/// </summary>
public enum VendorInquiryStatus
{
    New = 0,
    Read = 1,
    Responded = 2,
    Accepted = 3,
    Declined = 4,
    Closed = 5
}
