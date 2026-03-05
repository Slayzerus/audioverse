using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

public class InquiryHandlers(IVendorRepository repo)
    : IRequestHandler<SendVendorInquiryCommand, VendorInquiry>,
      IRequestHandler<UpdateInquiryStatusCommand, bool>
{
    public async Task<VendorInquiry> Handle(SendVendorInquiryCommand req, CancellationToken ct)
    {
        var inquiry = new VendorInquiry
        {
            VendorProfileId = req.VendorProfileId, UserId = req.UserId,
            ContactName = req.ContactName, ContactEmail = req.ContactEmail,
            ContactPhone = req.ContactPhone, EventId = req.EventId,
            EventDate = req.EventDate, GuestCount = req.GuestCount,
            Message = req.Message, Budget = req.Budget, Currency = req.Currency
        };
        return await repo.CreateInquiryAsync(inquiry);
    }

    public async Task<bool> Handle(UpdateInquiryStatusCommand req, CancellationToken ct)
    {
        if (!await repo.IsVendorOwnerAsync(req.VendorProfileId, req.OwnerUserId, ct)) return false;

        var inquiry = await repo.GetInquiryByIdAsync(req.InquiryId);
        if (inquiry == null || inquiry.VendorProfileId != req.VendorProfileId) return false;
        inquiry.Status = req.Status;
        if (req.Status == VendorInquiryStatus.Responded) inquiry.RespondedAtUtc = DateTime.UtcNow;
        await repo.SaveChangesAsync(ct);
        return true;
    }
}
