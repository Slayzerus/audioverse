namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions
{
    public enum KaraokePlayerStatus
    {
        None = 0,
        /// <summary>User signed up (RSVP) but has not arrived yet.</summary>
        Registered = 6,
        /// <summary>User arrived and is waiting for bouncer check-in.</summary>
        Waiting = 1,
        /// <summary>Bouncer is currently validating the participant.</summary>
        Validation = 2,
        /// <summary>Participant admitted inside the event.</summary>
        Inside = 3,
        /// <summary>Participant is outside (rejected or stepped out).</summary>
        Outside = 4,
        /// <summary>Participant has left the event.</summary>
        Left = 5
    }
}
