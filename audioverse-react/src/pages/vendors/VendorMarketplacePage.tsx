// VendorMarketplacePage.tsx — Browse vendor marketplace, filter by category/city, view details
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import {
  useVendorsQuery,
  useVendorCategoriesQuery,
} from "../../scripts/api/apiVendorMarketplace";
import type { VendorListParams } from "../../models/modelsVendorMarketplace";

const VendorMarketplacePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [params, setParams] = useState<VendorListParams>({
    category: searchParams.get("category") || undefined,
    city: searchParams.get("city") || undefined,
    page: 1,
    pageSize: 20,
  });
  const [cityInput, setCityInput] = useState(params.city ?? "");

  const { data: vendorsData, isLoading } = useVendorsQuery(params);
  const { data: categories } = useVendorCategoriesQuery();

  const vendors = vendorsData?.items ?? [];
  const totalVendors = vendorsData?.total ?? 0;
  const totalPages = Math.ceil(totalVendors / (params.pageSize ?? 20));

  // Sync URL params
  useEffect(() => {
    const sp = new URLSearchParams();
    if (params.category) sp.set("category", params.category);
    if (params.city) sp.set("city", params.city);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    setSearchParams(sp, { replace: true });
  }, [params.category, params.city, params.page, setSearchParams]);

  const handleCategoryChange = useCallback((cat: string | undefined) => {
    setParams(p => ({ ...p, category: cat, page: 1 }));
  }, []);

  const handleCitySearch = useCallback(() => {
    setParams(p => ({ ...p, city: cityInput || undefined, page: 1 }));
  }, [cityInput]);

  const renderStars = (rating: number | null) => {
    if (rating == null) return <span className="text-muted">{t("vendor.noRating", "No rating")}</span>;
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
      <span title={`${rating.toFixed(1)} / 5`}>
        {"★".repeat(full)}{half ? "½" : ""}{"☆".repeat(5 - full - (half ? 1 : 0))}
        <small className="ms-1 text-muted">({rating.toFixed(1)})</small>
      </span>
    );
  };

  return (
    <div className="container py-4">
      <h1 className="mb-3">
        <i className="bi bi-shop me-2" />
        {t("vendor.title", "Vendor Marketplace")}
      </h1>
      <p className="text-muted mb-4">{t("vendor.subtitle", "Browse vendors, compare offers, and plan your event.")}</p>

      {/* Filters */}
      <div className="row g-3 mb-4">
        {/* Category filter */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">{t("vendor.category", "Category")}</label>
          <select
            className="form-select"
            value={params.category ?? ""}
            onChange={e => handleCategoryChange(e.target.value || undefined)}
          >
            <option value="">{t("vendor.allCategories", "All categories")}</option>
            {categories?.map(c => (
              <option key={c.category} value={c.category}>
                {c.category} ({c.vendorCount})
              </option>
            ))}
          </select>
        </div>

        {/* City filter */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">{t("vendor.city", "City")}</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder={t("vendor.cityPlaceholder", "e.g. Warsaw")}
              value={cityInput}
              onChange={e => setCityInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCitySearch()}
            />
            <button className="btn btn-outline-secondary" onClick={handleCitySearch}>
              <i className="bi bi-search" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="col-md-4 d-flex align-items-end">
          <span className="text-muted">
            {t("vendor.found", "Found")}: <strong>{totalVendors}</strong> {t("vendor.vendors", "vendors")}
          </span>
        </div>
      </div>

      {/* Vendors grid */}
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      ) : vendors.length === 0 ? (
        <div className="alert alert-info">{t("vendor.noResults", "No vendors found for these filters.")}</div>
      ) : (
        <div className="row g-3">
          {vendors.map(v => (
            <div key={v.id} className="col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                {v.coverImageUrl && (
                  <img src={v.coverImageUrl} className="card-img-top" alt={v.displayName} style={{ height: 160, objectFit: "cover" }} />
                )}
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center mb-2">
                    {v.logoUrl && <img src={v.logoUrl} alt={`${v.displayName} logo`} className="rounded-circle me-2" style={{ width: 40, height: 40, objectFit: "cover" }} />}
                    <div>
                      <h5 className="card-title mb-0">
                        <Link to={`/vendors/${v.slug}`} className="text-decoration-none">{v.displayName}</Link>
                      </h5>
                      <small className="text-muted">{v.organizationName}</small>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="badge bg-primary me-1">{v.serviceCategory}</span>
                    {v.city && <span className="badge bg-secondary">{v.city}{v.country ? `, ${v.country}` : ""}</span>}
                  </div>
                  <div className="mb-2">{renderStars(v.averageRating)}</div>
                  {v.description && <p className="card-text text-muted small flex-grow-1">{v.description.substring(0, 120)}{v.description.length > 120 ? "…" : ""}</p>}
                  <Link to={`/vendors/${v.slug}`} className="btn btn-outline-primary btn-sm mt-auto">
                    {t("vendor.viewProfile", "View Profile")}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4 d-flex justify-content-center">
          <ul className="pagination">
            <li className={`page-item ${params.page === 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) - 1 }))}>«</button>
            </li>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(pg => (
              <li key={pg} className={`page-item ${params.page === pg ? "active" : ""}`}>
                <button className="page-link" onClick={() => setParams(p => ({ ...p, page: pg }))}>{pg}</button>
              </li>
            ))}
            <li className={`page-item ${params.page === totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) + 1 }))}>»</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default VendorMarketplacePage;
