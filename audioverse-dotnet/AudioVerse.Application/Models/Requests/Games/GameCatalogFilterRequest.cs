namespace AudioVerse.Application.Models.Requests.Games;

public class GameCatalogFilterRequest
{
    public string? Query { get; set; }
    public int? MinPlayers { get; set; }
    public int? MaxPlayers { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } = "Name";
    public bool Descending { get; set; } = false;
}
