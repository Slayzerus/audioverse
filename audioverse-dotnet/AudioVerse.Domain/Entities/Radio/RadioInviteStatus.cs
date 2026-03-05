namespace AudioVerse.Domain.Entities.Radio;

/// <summary>Status of a radio station guest invite.</summary>
public enum RadioInviteStatus
{
    Pending = 0,
    Accepted = 1,
    Revoked = 2,
    Expired = 3
}
