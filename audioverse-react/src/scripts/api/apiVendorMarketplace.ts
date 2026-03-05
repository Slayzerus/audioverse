// apiVendorMarketplace.ts — Vendor Marketplace API (React Query hooks + fetchers)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
  VendorProfileDetailDto,
  VendorsPaginatedResponse,
  VendorCategoryDto,
  VendorPriceListItemDto,
  VendorMenuItemDto,
  VendorPortfolioItemDto,
  VendorReviewDto,
  VendorInquiryDto,
  VendorOfferDto,
  EventVendorDto,
  EventVendorCompareDto,
  VendorProfileCreateRequest,
  VendorProfileUpdateRequest,
  VendorPriceListItemRequest,
  VendorMenuItemRequest,
  VendorPortfolioItemRequest,
  VendorReviewCreateRequest,
  VendorInquiryCreateRequest,
  VendorOfferCreateRequest,
  EventVendorCreateRequest,
  EventVendorStatusRequest,
  InquiryStatusRequest,
  OfferRespondRequest,
  VendorListParams,
} from "../../models/modelsVendorMarketplace";

// === Base path ===
export const VENDORS_BASE = "/api/vendors";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const VENDORS_QK = {
  all: ["vendors"] as const,
  list: (params: Record<string, unknown>) => ["vendors", "list", params] as const,
  categories: ["vendors", "categories"] as const,
  detail: (slug: string) => ["vendors", "detail", slug] as const,
  pricelist: (vendorId: number) => ["vendors", vendorId, "pricelist"] as const,
  menu: (vendorId: number) => ["vendors", vendorId, "menu"] as const,
  portfolio: (vendorId: number) => ["vendors", vendorId, "portfolio"] as const,
  reviews: (vendorId: number) => ["vendors", vendorId, "reviews"] as const,
  inquiries: (vendorId: number) => ["vendors", vendorId, "inquiries"] as const,
  offers: (vendorId: number) => ["vendors", vendorId, "offers"] as const,
  offerDetail: (offerId: number) => ["vendors", "offers", offerId] as const,
  myOffers: ["vendors", "offers", "my"] as const,
  eventVendors: (eventId: number) => ["vendors", "event-vendors", eventId] as const,
  eventVendorCompare: (eventId: number, category: string) =>
    ["vendors", "event-vendors", eventId, "compare", category] as const,
};

// ═══════════════════════════════════════════════════════════════════
// Low-level fetchers
// ═══════════════════════════════════════════════════════════════════

// --- Browse (public) ---

/** @internal GET /api/vendors — paginated vendor list with optional filters */
export const fetchVendors = async (params?: VendorListParams): Promise<VendorsPaginatedResponse> => {
  const { data } = await apiClient.get<VendorsPaginatedResponse>(VENDORS_BASE, { params });
  return data;
};

/** @internal GET /api/vendors/categories — available categories with counts */
export const fetchVendorCategories = async (): Promise<VendorCategoryDto[]> => {
  const { data } = await apiClient.get<VendorCategoryDto[]>(apiPath(VENDORS_BASE, "categories"));
  return data;
};

/** @internal GET /api/vendors/{slug} — vendor profile detail */
export const fetchVendorBySlug = async (slug: string): Promise<VendorProfileDetailDto> => {
  const { data } = await apiClient.get<VendorProfileDetailDto>(`${VENDORS_BASE}/${slug}`);
  return data;
};

/** @internal GET /api/vendors/{vendorId}/pricelist */
export const fetchVendorPricelist = async (vendorId: number): Promise<VendorPriceListItemDto[]> => {
  const { data } = await apiClient.get<VendorPriceListItemDto[]>(apiPath(VENDORS_BASE, `${vendorId}/pricelist`));
  return data;
};

/** @internal GET /api/vendors/{vendorId}/menu */
export const fetchVendorMenu = async (vendorId: number): Promise<VendorMenuItemDto[]> => {
  const { data } = await apiClient.get<VendorMenuItemDto[]>(apiPath(VENDORS_BASE, `${vendorId}/menu`));
  return data;
};

/** @internal GET /api/vendors/{vendorId}/portfolio */
export const fetchVendorPortfolio = async (vendorId: number): Promise<VendorPortfolioItemDto[]> => {
  const { data } = await apiClient.get<VendorPortfolioItemDto[]>(apiPath(VENDORS_BASE, `${vendorId}/portfolio`));
  return data;
};

/** @internal GET /api/vendors/{vendorId}/reviews */
export const fetchVendorReviews = async (vendorId: number): Promise<VendorReviewDto[]> => {
  const { data } = await apiClient.get<VendorReviewDto[]>(apiPath(VENDORS_BASE, `${vendorId}/reviews`));
  return data;
};

// --- Profile management (owner) ---

/** POST /api/vendors — create vendor profile */
export const createVendorProfile = async (req: VendorProfileCreateRequest): Promise<VendorProfileDetailDto> => {
  const { data } = await apiClient.post<VendorProfileDetailDto>(VENDORS_BASE, req);
  return data;
};

/** PUT /api/vendors/{id} — update vendor profile */
export const updateVendorProfile = async (id: number, req: VendorProfileUpdateRequest): Promise<VendorProfileDetailDto> => {
  const { data } = await apiClient.put<VendorProfileDetailDto>(apiPath(VENDORS_BASE, `${id}`), req);
  return data;
};

// --- Price list management ---

/** POST /api/vendors/{vendorId}/pricelist */
export const createPriceListItem = async (vendorId: number, req: VendorPriceListItemRequest): Promise<VendorPriceListItemDto> => {
  const { data } = await apiClient.post<VendorPriceListItemDto>(apiPath(VENDORS_BASE, `${vendorId}/pricelist`), req);
  return data;
};

/** PUT /api/vendors/{vendorId}/pricelist/{itemId} */
export const updatePriceListItem = async (vendorId: number, itemId: number, req: VendorPriceListItemRequest): Promise<VendorPriceListItemDto> => {
  const { data } = await apiClient.put<VendorPriceListItemDto>(apiPath(VENDORS_BASE, `${vendorId}/pricelist/${itemId}`), req);
  return data;
};

/** @internal DELETE /api/vendors/{vendorId}/pricelist/{itemId} */
export const deletePriceListItem = async (vendorId: number, itemId: number): Promise<void> => {
  await apiClient.delete(apiPath(VENDORS_BASE, `${vendorId}/pricelist/${itemId}`));
};

// --- Menu management ---

/** POST /api/vendors/{vendorId}/menu */
export const createMenuItem = async (vendorId: number, req: VendorMenuItemRequest): Promise<VendorMenuItemDto> => {
  const { data } = await apiClient.post<VendorMenuItemDto>(apiPath(VENDORS_BASE, `${vendorId}/menu`), req);
  return data;
};

/** PUT /api/vendors/{vendorId}/menu/{itemId} */
export const updateMenuItem = async (vendorId: number, itemId: number, req: VendorMenuItemRequest): Promise<VendorMenuItemDto> => {
  const { data } = await apiClient.put<VendorMenuItemDto>(apiPath(VENDORS_BASE, `${vendorId}/menu/${itemId}`), req);
  return data;
};

/** @internal DELETE /api/vendors/{vendorId}/menu/{itemId} */
export const deleteMenuItem = async (vendorId: number, itemId: number): Promise<void> => {
  await apiClient.delete(apiPath(VENDORS_BASE, `${vendorId}/menu/${itemId}`));
};

// --- Portfolio management ---

/** POST /api/vendors/{vendorId}/portfolio */
export const createPortfolioItem = async (vendorId: number, req: VendorPortfolioItemRequest): Promise<VendorPortfolioItemDto> => {
  const { data } = await apiClient.post<VendorPortfolioItemDto>(apiPath(VENDORS_BASE, `${vendorId}/portfolio`), req);
  return data;
};

/** @internal DELETE /api/vendors/{vendorId}/portfolio/{itemId} */
export const deletePortfolioItem = async (vendorId: number, itemId: number): Promise<void> => {
  await apiClient.delete(apiPath(VENDORS_BASE, `${vendorId}/portfolio/${itemId}`));
};

// --- Inquiries ---

/** POST /api/vendors/{vendorId}/inquiries — send inquiry (public/user) */
export const createInquiry = async (vendorId: number, req: VendorInquiryCreateRequest): Promise<VendorInquiryDto> => {
  const { data } = await apiClient.post<VendorInquiryDto>(apiPath(VENDORS_BASE, `${vendorId}/inquiries`), req);
  return data;
};

/** @internal GET /api/vendors/{vendorId}/inquiries — list inquiries (owner) */
export const fetchInquiries = async (vendorId: number): Promise<VendorInquiryDto[]> => {
  const { data } = await apiClient.get<VendorInquiryDto[]>(apiPath(VENDORS_BASE, `${vendorId}/inquiries`));
  return data;
};

/** PATCH /api/vendors/{vendorId}/inquiries/{inquiryId}/status — change inquiry status */
export const updateInquiryStatus = async (vendorId: number, inquiryId: number, req: InquiryStatusRequest): Promise<VendorInquiryDto> => {
  const { data } = await apiClient.patch<VendorInquiryDto>(apiPath(VENDORS_BASE, `${vendorId}/inquiries/${inquiryId}/status`), req);
  return data;
};

// --- Offers ---

/** POST /api/vendors/{vendorId}/offers — create offer (owner) */
export const createOffer = async (vendorId: number, req: VendorOfferCreateRequest): Promise<VendorOfferDto> => {
  const { data } = await apiClient.post<VendorOfferDto>(apiPath(VENDORS_BASE, `${vendorId}/offers`), req);
  return data;
};

/** @internal GET /api/vendors/offers/{offerId} — offer detail */
export const fetchOfferById = async (offerId: number): Promise<VendorOfferDto> => {
  const { data } = await apiClient.get<VendorOfferDto>(apiPath(VENDORS_BASE, `offers/${offerId}`));
  return data;
};

/** PATCH /api/vendors/offers/{offerId}/send — send offer to client */
export const sendOffer = async (offerId: number): Promise<VendorOfferDto> => {
  const { data } = await apiClient.patch<VendorOfferDto>(apiPath(VENDORS_BASE, `offers/${offerId}/send`));
  return data;
};

/** PATCH /api/vendors/offers/{offerId}/respond — accept/reject offer */
export const respondToOffer = async (offerId: number, req: OfferRespondRequest): Promise<VendorOfferDto> => {
  const { data } = await apiClient.patch<VendorOfferDto>(apiPath(VENDORS_BASE, `offers/${offerId}/respond`), req);
  return data;
};

/** @internal GET /api/vendors/{vendorId}/offers — vendor's offers */
export const fetchVendorOffers = async (vendorId: number): Promise<VendorOfferDto[]> => {
  const { data } = await apiClient.get<VendorOfferDto[]>(apiPath(VENDORS_BASE, `${vendorId}/offers`));
  return data;
};

/** @internal GET /api/vendors/offers/my — my received offers */
export const fetchMyOffers = async (): Promise<VendorOfferDto[]> => {
  const { data } = await apiClient.get<VendorOfferDto[]>(apiPath(VENDORS_BASE, "offers/my"));
  return data;
};

// --- Reviews ---

/** POST /api/vendors/{vendorId}/reviews — add review */
export const createReview = async (vendorId: number, req: VendorReviewCreateRequest): Promise<VendorReviewDto> => {
  const { data } = await apiClient.post<VendorReviewDto>(apiPath(VENDORS_BASE, `${vendorId}/reviews`), req);
  return data;
};

// --- Event vendors ---

/** POST /api/vendors/event-vendors — attach vendor to event */
export const createEventVendor = async (req: EventVendorCreateRequest): Promise<EventVendorDto> => {
  const { data } = await apiClient.post<EventVendorDto>(apiPath(VENDORS_BASE, "event-vendors"), req);
  return data;
};

/** @internal GET /api/vendors/event-vendors/{eventId} — list event vendors */
export const fetchEventVendors = async (eventId: number): Promise<EventVendorDto[]> => {
  const { data } = await apiClient.get<EventVendorDto[]>(apiPath(VENDORS_BASE, `event-vendors/${eventId}`));
  return data;
};

/** GET /api/vendors/event-vendors/{eventId}/compare?category= — compare vendors */
export const compareEventVendors = async (eventId: number, category: string): Promise<EventVendorCompareDto[]> => {
  const { data } = await apiClient.get<EventVendorCompareDto[]>(
    apiPath(VENDORS_BASE, `event-vendors/${eventId}/compare`),
    { params: { category } },
  );
  return data;
};

/** PATCH /api/vendors/event-vendors/{id}/status — update event vendor status */
export const updateEventVendorStatus = async (id: number, req: EventVendorStatusRequest): Promise<EventVendorDto> => {
  const { data } = await apiClient.patch<EventVendorDto>(apiPath(VENDORS_BASE, `event-vendors/${id}/status`), req);
  return data;
};

// ═══════════════════════════════════════════════════════════════════
// React Query hooks
// ═══════════════════════════════════════════════════════════════════

// --- Browse ---

export const useVendorsQuery = (params?: VendorListParams) =>
  useQuery({
    queryKey: VENDORS_QK.list((params ?? {}) as Record<string, unknown>),
    queryFn: () => fetchVendors(params),
  });

export const useVendorCategoriesQuery = () =>
  useQuery({ queryKey: VENDORS_QK.categories, queryFn: fetchVendorCategories, staleTime: 5 * 60_000 });

export const useVendorDetailQuery = (slug: string | undefined) =>
  useQuery({
    queryKey: VENDORS_QK.detail(slug ?? ""),
    queryFn: () => fetchVendorBySlug(slug!),
    enabled: !!slug,
  });

export const useVendorPricelistQuery = (vendorId: number | undefined) =>
  useQuery({
    queryKey: VENDORS_QK.pricelist(vendorId ?? 0),
    queryFn: () => fetchVendorPricelist(vendorId!),
    enabled: !!vendorId,
  });

export const useVendorMenuQuery = (vendorId: number | undefined) =>
  useQuery({
    queryKey: VENDORS_QK.menu(vendorId ?? 0),
    queryFn: () => fetchVendorMenu(vendorId!),
    enabled: !!vendorId,
  });

export const useVendorPortfolioQuery = (vendorId: number | undefined) =>
  useQuery({
    queryKey: VENDORS_QK.portfolio(vendorId ?? 0),
    queryFn: () => fetchVendorPortfolio(vendorId!),
    enabled: !!vendorId,
  });

export const useVendorReviewsQuery = (vendorId: number | undefined) =>
  useQuery({
    queryKey: VENDORS_QK.reviews(vendorId ?? 0),
    queryFn: () => fetchVendorReviews(vendorId!),
    enabled: !!vendorId,
  });

// --- Inquiries ---

export const useVendorInquiriesQuery = (vendorId: number | undefined) =>
  useQuery({
    queryKey: VENDORS_QK.inquiries(vendorId ?? 0),
    queryFn: () => fetchInquiries(vendorId!),
    enabled: !!vendorId,
  });

// --- Offers ---

export const useVendorOffersQuery = (vendorId: number | undefined) =>
  useQuery({
    queryKey: VENDORS_QK.offers(vendorId ?? 0),
    queryFn: () => fetchVendorOffers(vendorId!),
    enabled: !!vendorId,
  });

export const useOfferDetailQuery = (offerId: number | undefined) =>
  useQuery({
    queryKey: VENDORS_QK.offerDetail(offerId ?? 0),
    queryFn: () => fetchOfferById(offerId!),
    enabled: !!offerId,
  });

export const useMyOffersQuery = () =>
  useQuery({ queryKey: VENDORS_QK.myOffers, queryFn: fetchMyOffers });

// --- Event vendors ---

export const useEventVendorsQuery = (eventId: number | undefined) =>
  useQuery({
    queryKey: VENDORS_QK.eventVendors(eventId ?? 0),
    queryFn: () => fetchEventVendors(eventId!),
    enabled: !!eventId,
  });

export const useEventVendorCompareQuery = (eventId: number | undefined, category: string) =>
  useQuery({
    queryKey: VENDORS_QK.eventVendorCompare(eventId ?? 0, category),
    queryFn: () => compareEventVendors(eventId!, category),
    enabled: !!eventId && !!category,
  });

// ═══════════════════════════════════════════════════════════════════
// Mutations
// ═══════════════════════════════════════════════════════════════════

/** Create vendor profile */
export const useCreateVendorProfileMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: VendorProfileCreateRequest) => createVendorProfile(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: VENDORS_QK.all }); },
  });
};

/** Update vendor profile */
export const useUpdateVendorProfileMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: VendorProfileUpdateRequest }) => updateVendorProfile(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: VENDORS_QK.all }); },
  });
};

// --- Price list ---

export const useCreatePriceListItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, req }: { vendorId: number; req: VendorPriceListItemRequest }) =>
      createPriceListItem(vendorId, req),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.pricelist(vendorId) }); },
  });
};

export const useUpdatePriceListItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, itemId, req }: { vendorId: number; itemId: number; req: VendorPriceListItemRequest }) =>
      updatePriceListItem(vendorId, itemId, req),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.pricelist(vendorId) }); },
  });
};

export const useDeletePriceListItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, itemId }: { vendorId: number; itemId: number }) =>
      deletePriceListItem(vendorId, itemId),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.pricelist(vendorId) }); },
  });
};

// --- Menu ---

export const useCreateMenuItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, req }: { vendorId: number; req: VendorMenuItemRequest }) =>
      createMenuItem(vendorId, req),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.menu(vendorId) }); },
  });
};

export const useUpdateMenuItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, itemId, req }: { vendorId: number; itemId: number; req: VendorMenuItemRequest }) =>
      updateMenuItem(vendorId, itemId, req),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.menu(vendorId) }); },
  });
};

export const useDeleteMenuItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, itemId }: { vendorId: number; itemId: number }) =>
      deleteMenuItem(vendorId, itemId),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.menu(vendorId) }); },
  });
};

// --- Portfolio ---

export const useCreatePortfolioItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, req }: { vendorId: number; req: VendorPortfolioItemRequest }) =>
      createPortfolioItem(vendorId, req),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.portfolio(vendorId) }); },
  });
};

export const useDeletePortfolioItemMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, itemId }: { vendorId: number; itemId: number }) =>
      deletePortfolioItem(vendorId, itemId),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.portfolio(vendorId) }); },
  });
};

// --- Inquiries ---

export const useCreateInquiryMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, req }: { vendorId: number; req: VendorInquiryCreateRequest }) =>
      createInquiry(vendorId, req),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.inquiries(vendorId) }); },
  });
};

export const useUpdateInquiryStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, inquiryId, req }: { vendorId: number; inquiryId: number; req: InquiryStatusRequest }) =>
      updateInquiryStatus(vendorId, inquiryId, req),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.inquiries(vendorId) }); },
  });
};

// --- Offers ---

export const useCreateOfferMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, req }: { vendorId: number; req: VendorOfferCreateRequest }) =>
      createOffer(vendorId, req),
    onSuccess: (_d, { vendorId }) => {
      qc.invalidateQueries({ queryKey: VENDORS_QK.offers(vendorId) });
      qc.invalidateQueries({ queryKey: VENDORS_QK.inquiries(vendorId) });
    },
  });
};

export const useSendOfferMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (offerId: number) => sendOffer(offerId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: VENDORS_QK.all }); },
  });
};

export const useRespondToOfferMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, req }: { offerId: number; req: OfferRespondRequest }) => respondToOffer(offerId, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VENDORS_QK.myOffers });
      qc.invalidateQueries({ queryKey: VENDORS_QK.all });
    },
  });
};

// --- Reviews ---

export const useCreateReviewMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, req }: { vendorId: number; req: VendorReviewCreateRequest }) =>
      createReview(vendorId, req),
    onSuccess: (_d, { vendorId }) => { qc.invalidateQueries({ queryKey: VENDORS_QK.reviews(vendorId) }); },
  });
};

// --- Event vendors ---

export const useCreateEventVendorMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: EventVendorCreateRequest) => createEventVendor(req),
    onSuccess: (_d, req) => { qc.invalidateQueries({ queryKey: VENDORS_QK.eventVendors(req.eventId) }); },
  });
};

export const useUpdateEventVendorStatusMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: number; req: EventVendorStatusRequest }) =>
      updateEventVendorStatus(id, req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: VENDORS_QK.all }); },
  });
};
