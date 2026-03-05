// VendorMyOffersPage.tsx — List offers received by the current user, accept/reject
import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  useMyOffersQuery,
  useRespondToOfferMutation,
} from "../../scripts/api/apiVendorMarketplace";
import { OfferStatus } from "../../models/modelsVendorMarketplace";

const statusLabels: Record<number, string> = {
  [OfferStatus.Draft]: "Draft",
  [OfferStatus.Sent]: "Sent",
  [OfferStatus.Accepted]: "Accepted",
  [OfferStatus.Rejected]: "Rejected",
  [OfferStatus.Expired]: "Expired",
};

const statusColors: Record<number, string> = {
  [OfferStatus.Draft]: "secondary",
  [OfferStatus.Sent]: "primary",
  [OfferStatus.Accepted]: "success",
  [OfferStatus.Rejected]: "danger",
  [OfferStatus.Expired]: "warning",
};

const VendorMyOffersPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: offers, isLoading } = useMyOffersQuery();
  const respondMutation = useRespondToOfferMutation();

  const handleRespond = (offerId: number, accept: boolean) => {
    respondMutation.mutate({ offerId, req: { accept } });
  };

  return (
    <div className="container py-4">
      <h1 className="mb-3">
        <i className="bi bi-envelope-paper me-2" />
        {t("vendor.myOffers", "My Received Offers")}
      </h1>
      <p className="text-muted mb-4">{t("vendor.myOffersDesc", "Offers from vendors for your events and inquiries.")}</p>

      <Link to="/vendors" className="btn btn-outline-secondary btn-sm mb-3">
        <i className="bi bi-shop me-1" />{t("vendor.backToList", "Back to marketplace")}
      </Link>

      {isLoading ? (
        <div className="text-center py-5"><div className="spinner-border" /></div>
      ) : !offers || offers.length === 0 ? (
        <div className="alert alert-info">{t("vendor.noOffers", "You have no received offers yet.")}</div>
      ) : (
        <div className="list-group">
          {offers.map(offer => (
            <div key={offer.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="mb-1">{offer.title}</h5>
                  <small className="text-muted">{offer.vendorName ?? `Vendor #${offer.vendorProfileId}`}</small>
                </div>
                <span className={`badge bg-${statusColors[offer.status] ?? "secondary"}`}>
                  {statusLabels[offer.status] ?? "Unknown"}
                </span>
              </div>
              {offer.description && <p className="mb-1 small">{offer.description}</p>}

              {/* Items */}
              {offer.items.length > 0 && (
                <table className="table table-sm table-bordered mt-2 mb-2">
                  <thead>
                    <tr>
                      <th>{t("vendor.itemName", "Name")}</th>
                      <th className="text-center">{t("vendor.quantity", "Qty")}</th>
                      <th className="text-end">{t("vendor.unitPrice", "Unit Price")}</th>
                      <th className="text-end">{t("vendor.subtotal", "Subtotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offer.items.map(item => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">{item.unitPrice.toFixed(2)}</td>
                        <td className="text-end">{(item.quantity * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="text-end fw-bold">{t("vendor.total", "Total")}:</td>
                      <td className="text-end fw-bold">{offer.totalPrice.toFixed(2)} {offer.currency}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  {offer.validUntil && <span>{t("vendor.validUntil", "Valid until")}: {new Date(offer.validUntil).toLocaleDateString()}</span>}
                </small>
                {offer.status === OfferStatus.Sent && (
                  <div className="btn-group btn-group-sm">
                    <button className="btn btn-success" onClick={() => handleRespond(offer.id, true)} disabled={respondMutation.isPending}>
                      <i className="bi bi-check-lg me-1" />{t("vendor.accept", "Accept")}
                    </button>
                    <button className="btn btn-outline-danger" onClick={() => handleRespond(offer.id, false)} disabled={respondMutation.isPending}>
                      <i className="bi bi-x-lg me-1" />{t("vendor.reject", "Reject")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorMyOffersPage;
