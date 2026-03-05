using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

/// <summary>Dodaje recenzję vendora i przelicza średnią ocenę.</summary>
public class AddVendorReviewHandler(IVendorRepository repo) : IRequestHandler<AddVendorReviewCommand, int>
{
    public async Task<int> Handle(AddVendorReviewCommand req, CancellationToken ct)
    {
        if (req.Rating < 1 || req.Rating > 5)
            throw new InvalidOperationException("Rating 1–5");
        if (await repo.HasUserReviewedAsync(req.VendorProfileId, req.UserId))
            throw new InvalidOperationException("Already reviewed");

        var review = new VendorReview
        {
            VendorProfileId = req.VendorProfileId, UserId = req.UserId,
            Rating = req.Rating, Comment = req.Comment, EventId = req.EventId
        };
        await repo.AddReviewAsync(review);
        await repo.RecalculateRatingAsync(req.VendorProfileId, ct);

        return review.Id;
    }
}
