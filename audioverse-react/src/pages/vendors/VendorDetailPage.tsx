// VendorDetailPage.tsx — Vendor profile with pricelist, menu, portfolio, reviews, inquiry form
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "react-router-dom";
import {
  useVendorDetailQuery,
  useVendorPricelistQuery,
  useVendorMenuQuery,
  useVendorPortfolioQuery,
  useVendorReviewsQuery,
  useCreateInquiryMutation,
  useCreateReviewMutation,
} from "../../scripts/api/apiVendorMarketplace";
import type { VendorInquiryCreateRequest, VendorReviewCreateRequest } from "../../models/modelsVendorMarketplace";

type Tab = "pricelist" | "menu" | "portfolio" | "reviews" | "inquiry";

const VendorDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("pricelist");

  const { data: vendor, isLoading, error } = useVendorDetailQuery(slug);
  const vendorId = vendor?.id;
  const { data: pricelist } = useVendorPricelistQuery(activeTab === "pricelist" ? vendorId : undefined);
  const { data: menu } = useVendorMenuQuery(activeTab === "menu" ? vendorId : undefined);
  const { data: portfolio } = useVendorPortfolioQuery(activeTab === "portfolio" ? vendorId : undefined);
  const { data: reviews } = useVendorReviewsQuery(activeTab === "reviews" ? vendorId : undefined);

  const inquiryMutation = useCreateInquiryMutation();
  const reviewMutation = useCreateReviewMutation();

  // Inquiry form
  const [inquiry, setInquiry] = useState<VendorInquiryCreateRequest>({
    contactName: "", contactEmail: "", message: "",
  });
  const [inquirySent, setInquirySent] = useState(false);

  // Review form
  const [review, setReview] = useState<VendorReviewCreateRequest>({ rating: 5 });
  const [reviewSent, setReviewSent] = useState(false);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;
    await inquiryMutation.mutateAsync({ vendorId, req: inquiry });
    setInquirySent(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;
    await reviewMutation.mutateAsync({ vendorId, req: review });
    setReviewSent(true);
  };

  if (isLoading) return <div className="container py-5 text-center"><div className="spinner-border" /></div>;
  if (error || !vendor) return (
    <div className="container py-5">
      <div className="alert alert-warning">{t("vendor.notFound", "Vendor not found.")}</div>
      <Link to="/vendors" className="btn btn-outline-primary">{t("vendor.backToList", "Back to marketplace")}</Link>
    </div>
  );

  const renderStars = (r: number | null) => {
    if (r == null) return null;
    return <span>{"★".repeat(Math.floor(r))}{"☆".repeat(5 - Math.floor(r))} ({r.toFixed(1)})</span>;
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "pricelist", label: t("vendor.tabs.pricelist", "Price List") },
    { key: "menu", label: t("vendor.tabs.menu", "Menu") },
    { key: "portfolio", label: t("vendor.tabs.portfolio", "Portfolio") },
    { key: "reviews", label: t("vendor.tabs.reviews", "Reviews") },
    { key: "inquiry", label: t("vendor.tabs.inquiry", "Send Inquiry") },
  ];

  return (
    <div className="container py-4">
      {/* Back link */}
      <Link to="/vendors" className="text-decoration-none mb-3 d-inline-block">
        <i className="bi bi-arrow-left me-1" />{t("vendor.backToList", "Back to marketplace")}
      </Link>

      {/* Header */}
      <div className="card mb-4">
        {vendor.coverImageUrl && (
          <img src={vendor.coverImageUrl} className="card-img-top" alt={`${vendor.displayName} cover`} style={{ height: 220, objectFit: "cover" }} />
        )}
        <div className="card-body">
          <div className="d-flex align-items-start gap-3">
            {vendor.logoUrl && <img src={vendor.logoUrl} alt={`${vendor.displayName} logo`} className="rounded" style={{ width: 80, height: 80, objectFit: "cover" }} />}
            <div className="flex-grow-1">
              <h2 className="mb-1">{vendor.displayName}</h2>
              <p className="text-muted mb-1">{vendor.organizationName}</p>
              <div className="mb-2">
                <span className="badge bg-primary me-1">{vendor.serviceCategory}</span>
                {vendor.city && <span className="badge bg-secondary me-1">{vendor.city}</span>}
                {vendor.country && <span className="badge bg-secondary">{vendor.country}</span>}
              </div>
              {vendor.averageRating != null && (
                <div className="mb-2">{renderStars(vendor.averageRating)} <small className="text-muted">({vendor.reviewCount} {t("vendor.reviewsCount", "reviews")})</small></div>
              )}
              {vendor.description && <p className="mb-2">{vendor.description}</p>}
              <div className="small text-muted">
                {vendor.phone && <span className="me-3"><i className="bi bi-telephone me-1" />{vendor.phone}</span>}
                {vendor.email && <span className="me-3"><i className="bi bi-envelope me-1" />{vendor.email}</span>}
                {vendor.website && <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="me-3"><i className="bi bi-globe me-1" />{t("vendor.website", "Website")}</a>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {tabs.map(tab => (
          <li key={tab.key} className="nav-item">
            <button className={`nav-link ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab content */}
      {activeTab === "pricelist" && (
        <div>
          <h4>{t("vendor.tabs.pricelist", "Price List")}</h4>
          {!pricelist || pricelist.length === 0 ? (
            <p className="text-muted">{t("vendor.noPricelist", "No price list items yet.")}</p>
          ) : (
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>{t("vendor.itemName", "Name")}</th>
                  <th>{t("vendor.description", "Description")}</th>
                  <th className="text-end">{t("vendor.price", "Price")}</th>
                  <th>{t("vendor.unit", "Unit")}</th>
                </tr>
              </thead>
              <tbody>
                {pricelist.map(item => (
                  <tr key={item.id} className={!item.isAvailable ? "text-muted" : ""}>
                    <td>{item.name}{!item.isAvailable && <small className="ms-1 badge bg-warning">{t("vendor.unavailable", "Unavailable")}</small>}</td>
                    <td className="small">{item.description}</td>
                    <td className="text-end fw-semibold">{item.price.toFixed(2)} {item.currency}</td>
                    <td>{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "menu" && (
        <div>
          <h4>{t("vendor.tabs.menu", "Menu")}</h4>
          {!menu || menu.length === 0 ? (
            <p className="text-muted">{t("vendor.noMenu", "No menu items yet.")}</p>
          ) : (
            <div className="row g-3">
              {menu.map(item => (
                <div key={item.id} className="col-md-6">
                  <div className={`card ${!item.isAvailable ? "opacity-50" : ""}`}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <h6>{item.name}</h6>
                        <span className="fw-bold">{item.price.toFixed(2)} {item.currency}</span>
                      </div>
                      {item.description && <p className="small text-muted mb-1">{item.description}</p>}
                      {item.category && <span className="badge bg-light text-dark me-1">{item.category}</span>}
                      {item.isVegetarian && <span className="badge bg-success me-1">🌿 {t("vendor.vegetarian", "Vegetarian")}</span>}
                      {item.isVegan && <span className="badge bg-success me-1">🌱 {t("vendor.vegan", "Vegan")}</span>}
                      {item.isGlutenFree && <span className="badge bg-info me-1">{t("vendor.glutenFree", "Gluten-free")}</span>}
                      {item.allergens && <small className="d-block text-warning mt-1">{t("vendor.allergens", "Allergens")}: {item.allergens}</small>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "portfolio" && (
        <div>
          <h4>{t("vendor.tabs.portfolio", "Portfolio")}</h4>
          {!portfolio || portfolio.length === 0 ? (
            <p className="text-muted">{t("vendor.noPortfolio", "No portfolio items yet.")}</p>
          ) : (
            <div className="row g-3">
              {portfolio.map(item => (
                <div key={item.id} className="col-md-4 col-lg-3">
                  <div className="card">
                    {item.mediaType === "video" ? (
                      <video src={item.mediaUrl} controls className="card-img-top" style={{ height: 180, objectFit: "cover" }} />
                    ) : (
                      <img src={item.mediaUrl} alt={item.title ?? ""} className="card-img-top" style={{ height: 180, objectFit: "cover" }} />
                    )}
                    {item.title && <div className="card-body p-2"><small className="fw-semibold">{item.title}</small></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div>
          <h4>{t("vendor.tabs.reviews", "Reviews")}</h4>
          {!reviews || reviews.length === 0 ? (
            <p className="text-muted">{t("vendor.noReviews", "No reviews yet.")}</p>
          ) : (
            <div className="list-group mb-4">
              {reviews.map(r => (
                <div key={r.id} className="list-group-item">
                  <div className="d-flex justify-content-between">
                    <strong>{r.userName ?? t("vendor.anonymous", "Anonymous")}</strong>
                    <span>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p className="mb-1 mt-1">{r.comment}</p>}
                  <small className="text-muted">{new Date(r.createdAt).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          )}

          {/* Add review form */}
          {!reviewSent ? (
            <form onSubmit={handleReviewSubmit} className="card p-3">
              <h6>{t("vendor.addReview", "Write a Review")}</h6>
              <div className="mb-2">
                <label className="form-label">{t("vendor.rating", "Rating")}</label>
                <select className="form-select w-auto" value={review.rating} onChange={e => setReview(r => ({ ...r, rating: +e.target.value }))}>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{"★".repeat(n)} ({n})</option>)}
                </select>
              </div>
              <div className="mb-2">
                <textarea className="form-control" rows={3} placeholder={t("vendor.commentPlaceholder", "Your comment (optional)...")}
                  value={review.comment ?? ""} onChange={e => setReview(r => ({ ...r, comment: e.target.value || undefined }))} />
              </div>
              <button className="btn btn-primary btn-sm" type="submit" disabled={reviewMutation.isPending}>
                {t("vendor.submitReview", "Submit Review")}
              </button>
            </form>
          ) : (
            <div className="alert alert-success">{t("vendor.reviewSent", "Thank you for your review!")}</div>
          )}
        </div>
      )}

      {activeTab === "inquiry" && (
        <div>
          <h4>{t("vendor.tabs.inquiry", "Send Inquiry")}</h4>
          {!inquirySent ? (
            <form onSubmit={handleInquirySubmit} className="card p-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">{t("vendor.contactName", "Your Name")} *</label>
                  <input className="form-control" required value={inquiry.contactName} onChange={e => setInquiry(r => ({ ...r, contactName: e.target.value }))} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t("vendor.contactEmail", "Your Email")} *</label>
                  <input className="form-control" type="email" required value={inquiry.contactEmail} onChange={e => setInquiry(r => ({ ...r, contactEmail: e.target.value }))} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t("vendor.eventDate", "Event Date")}</label>
                  <input className="form-control" type="date" value={inquiry.eventDate ?? ""} onChange={e => setInquiry(r => ({ ...r, eventDate: e.target.value || undefined }))} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t("vendor.guestCount", "Guest Count")}</label>
                  <input className="form-control" type="number" min={1} value={inquiry.guestCount ?? ""} onChange={e => setInquiry(r => ({ ...r, guestCount: e.target.value ? +e.target.value : undefined }))} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">{t("vendor.budget", "Budget")}</label>
                  <input className="form-control" type="number" min={0} step={100} value={inquiry.budget ?? ""} onChange={e => setInquiry(r => ({ ...r, budget: e.target.value ? +e.target.value : undefined }))} />
                </div>
                <div className="col-12">
                  <label className="form-label">{t("vendor.message", "Message")} *</label>
                  <textarea className="form-control" rows={4} required value={inquiry.message} onChange={e => setInquiry(r => ({ ...r, message: e.target.value }))} />
                </div>
                <div className="col-12">
                  <button className="btn btn-primary" type="submit" disabled={inquiryMutation.isPending}>
                    <i className="bi bi-send me-1" />{t("vendor.sendInquiry", "Send Inquiry")}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="alert alert-success">
              <i className="bi bi-check-circle me-2" />{t("vendor.inquirySent", "Your inquiry has been sent! The vendor will contact you soon.")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorDetailPage;
