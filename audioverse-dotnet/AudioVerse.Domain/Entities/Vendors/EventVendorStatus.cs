namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Status of a vendor's association with an event (attached, considering, confirmed, rejected, cancelled).
/// </summary>
public enum EventVendorStatus
{
    Invited = 0,
    Considering = 1,
    Confirmed = 2,
    Declined = 3,
    Cancelled = 4
}
