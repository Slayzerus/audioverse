namespace AudioVerse.Application.Models.Dtos
{
    /// <summary>
    /// Gracz z innego profilu dostępny do zlinkowania.
    /// </summary>
    public class LinkCandidatePlayerDto
    {
        public int PlayerId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
        public string PreferredColors { get; set; } = string.Empty;
    }
}
