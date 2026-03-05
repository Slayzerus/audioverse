namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Status of a vendor offer in the marketplace.
/// </summary>
public enum VendorOfferStatus
{
    Draft = 0,
    Sent = 1,
    Viewed = 2,
    Accepted = 3,
    Declined = 4,
    Expired = 5
}
