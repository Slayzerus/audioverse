using MediatR;

namespace AudioVerse.Application.Queries.Wishlists;

/// <summary>Lista prezentowa po tokenie (gość klika link).</summary>
public record GetGiftRegistryByTokenQuery(string Token) : IRequest<GiftRegistryDetailDto?>;
