namespace AudioVerse.Domain.Enums
{
    /// <summary>
    /// Status połączenia między graczami.
    /// </summary>
    public enum PlayerLinkStatus
    {
        /// <summary>Aktywne połączenie.</summary>
        Active = 0,
        /// <summary>Cofnięte przez jedną ze stron.</summary>
        Revoked = 1
    }
}
