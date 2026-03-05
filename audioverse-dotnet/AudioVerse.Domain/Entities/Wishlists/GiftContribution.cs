namespace AudioVerse.Domain.Entities.Wishlists;

/// <summary>
/// Wkład osoby w prezent grupowy (rezerwacja / deklaracja).
/// </summary>
public class GiftContribution
{
    public int Id { get; set; }
    public int GiftRegistryItemId { get; set; }
    public GiftRegistryItem? GiftRegistryItem { get; set; }

    /// <summary>ID użytkownika (jeśli zalogowany).</summary>
    public int? UserId { get; set; }

    /// <summary>Imię/nick gościa (jeśli niezalogowany).</summary>
    public string? GuestName { get; set; }

    /// <summary>E-mail gościa (opcjonalny, do kontaktu).</summary>
    public string? GuestEmail { get; set; }

    /// <summary>Deklarowana kwota (jeśli prezent z kwotą).</summary>
    public decimal? Amount { get; set; }

    /// <summary>Opcjonalna wiadomość / życzenia.</summary>
    public string? Message { get; set; }

    /// <summary>Czy potwierdzone przez darczyńcę.</summary>
    public bool IsConfirmed { get; set; }

    /// <summary>Anonimowa rezerwacja (właściciel listy nie widzi kto).</summary>
    public bool IsAnonymous { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
