using AudioVerse.Application.Commands.Vendors;
using AudioVerse.Domain.Entities.Vendors;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Vendors;

public class EventVendorHandlers(IVendorRepository repo)
    : IRequestHandler<AddEventVendorCommand, EventVendor>,
      IRequestHandler<UpdateEventVendorStatusCommand, bool>
{
    public async Task<EventVendor> Handle(AddEventVendorCommand req, CancellationToken ct)
    {
        var ev = new EventVendor
        {
            EventId = req.EventId, VendorProfileId = req.VendorProfileId,
            ServiceCategory = req.ServiceCategory, AcceptedOfferId = req.AcceptedOfferId,
            Notes = req.Notes
        };
        return await repo.AddEventVendorAsync(ev);
    }

    public async Task<bool> Handle(UpdateEventVendorStatusCommand req, CancellationToken ct)
    {
        var ev = await repo.GetEventVendorByIdAsync(req.EventVendorId);
        if (ev == null) return false;
        ev.Status = req.Status;
        ev.AcceptedOfferId = req.AcceptedOfferId;
        await repo.SaveChangesAsync(ct);
        return true;
    }
}
