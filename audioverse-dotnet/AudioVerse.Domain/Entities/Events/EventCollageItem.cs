namespace AudioVerse.Domain.Entities.Events;

/// <summary>
/// Collage item — photo or video placed in 3D collage space.
/// X/Y coordinates in canvas pixels, Z as page/layer number.
/// FiltersJson describes arrangement (border, rotation, shadow, shape, etc.).
/// </summary>
public class EventCollageItem
{
    public int Id { get; set; }
    public int CollageId { get; set; }
    public EventCollage? Collage { get; set; }
    public int? PhotoId { get; set; }
    public EventPhoto? Photo { get; set; }
    public int? VideoId { get; set; }
    public EventVideo? Video { get; set; }
    public double X { get; set; }
    public double Y { get; set; }
    public int Z { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
    public double Rotation { get; set; }
    public int OrderInLayer { get; set; }
    /// <summary>
    /// JSON describing visual arrangement, e.g.:
    /// {"border":"2px solid gold","borderRadius":"8px","shadow":"4px 4px 10px rgba(0,0,0,0.3)","opacity":0.95,"clipShape":"circle","filter":"sepia"}
    /// </summary>
    public string? FiltersJson { get; set; }
}
