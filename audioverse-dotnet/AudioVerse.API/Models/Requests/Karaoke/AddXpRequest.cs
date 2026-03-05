using AudioVerse.Domain.Enums;

namespace AudioVerse.API.Models.Requests.Karaoke;

public record AddXpRequest(ProgressCategory Category, int Amount, string? Source);
