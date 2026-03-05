namespace AudioVerse.Domain.Enums
{
    public enum CollaborationPermission
    {
        Read = 0,
        Write = 1,
        Manage = 2 // can change metadata and status (InDevelopment, IsVerified)
    }
}
