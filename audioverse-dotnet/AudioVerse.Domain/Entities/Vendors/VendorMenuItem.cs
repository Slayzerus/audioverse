namespace AudioVerse.Domain.Entities.Vendors;

/// <summary>
/// Menu vendora — pozycja menu (catering/restauracja) z alergenami, dietami, zdjęciem.
/// </summary>
public class VendorMenuItem
{
    public int Id { get; set; }
    public int VendorProfileId { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Kategoria dania (przystawka, danie główne, deser, napój…).</summary>
    public string Category { get; set; } = "main";

    public decimal? Price { get; set; }
    public string Currency { get; set; } = "PLN";

    public string? ImageUrl { get; set; }

    /// <summary>Alergeny (CSV — np. "gluten,laktoza,orzechy").</summary>
    public string? Allergens { get; set; }

    public bool IsVegetarian { get; set; }
    public bool IsVegan { get; set; }
    public bool IsGlutenFree { get; set; }

    public bool IsAvailable { get; set; } = true;
    public int SortOrder { get; set; }
}
