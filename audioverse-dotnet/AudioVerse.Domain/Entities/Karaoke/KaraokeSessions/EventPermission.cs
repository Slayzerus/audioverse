namespace AudioVerse.Domain.Entities.Karaoke.KaraokeSessions
{
    [System.Flags]
    public enum EventPermission
    {
        None = 0,
        Invite = 1,
        ManageMusic = 2,
        Admit = 4,
        Moderate = 8,
        Bouncer = 16,
        All = Invite | ManageMusic | Admit | Moderate | Bouncer
    }
}
