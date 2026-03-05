// modelsVendorMarketplace.ts — Vendor Marketplace DTOs

// === Enums ===

export enum VendorServiceCategory {
  Catering = "Catering",
  Venue = "Venue",
  Music = "Music",
  Photography = "Photography",
  Videography = "Videography",
  Decorations = "Decorations",
  Flowers = "Flowers",
  Cake = "Cake",
  Entertainment = "Entertainment",
  Transport = "Transport",
  Accommodation = "Accommodation",
  Beauty = "Beauty",
  Invitations = "Invitations",
  Lighting = "Lighting",
  Sound = "Sound",
  Security = "Security",
  Cleaning = "Cleaning",
  Rentals = "Rentals",
  Planning = "Planning",
  Other = "Other",
}

export enum InquiryStatus {
  New = 0,
  InProgress = 1,
  Quoted = 2,
  Accepted = 3,
  Rejected = 4,
  Cancelled = 5,
}

export enum OfferStatus {
  Draft = 0,
  Sent = 1,
  Accepted = 2,
  Rejected = 3,
  Expired = 4,
}

export enum EventVendorStatus {
  Pending = 0,
  Confirmed = 1,
  Rejected = 2,
  Cancelled = 3,
}

// === Response DTOs ===

/** Vendor profile list item (GET /api/vendors) */
export interface VendorProfileListDto {
  id: number;
  organizationId: number;
  organizationName: string;
  slug: string;
  displayName: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  serviceCategory: string;
  city: string | null;
  region: string | null;
  country: string | null;
  averageRating: number | null;
  reviewCount: number;
  isActive: boolean;
}

/** Vendor profile detail (GET /api/vendors/{slug}) */
export interface VendorProfileDetailDto {
  id: number;
  organizationId: number;
  organizationName: string;
  slug: string;
  displayName: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  serviceCategory: string;
  city: string | null;
  region: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  averageRating: number | null;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Paginated vendor list */
export interface VendorsPaginatedResponse {
  total: number;
  page: number;
  pageSize: number;
  items: VendorProfileListDto[];
}

/** Category with vendor count */
export interface VendorCategoryDto {
  category: string;
  vendorCount: number;
}

// --- Price List ---

export interface VendorPriceListItemDto {
  id: number;
  vendorProfileId: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  unit: string | null;
  sortOrder: number;
  isAvailable: boolean;
}

// --- Menu ---

export interface VendorMenuItemDto {
  id: number;
  vendorProfileId: number;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  category: string | null;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  allergens: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isAvailable: boolean;
}

// --- Portfolio ---

export interface VendorPortfolioItemDto {
  id: number;
  vendorProfileId: number;
  title: string | null;
  description: string | null;
  mediaUrl: string;
  mediaType: string; // "image" | "video"
  sortOrder: number;
  createdAt: string;
}

// --- Reviews ---

export interface VendorReviewDto {
  id: number;
  vendorProfileId: number;
  userId: number;
  userName: string | null;
  rating: number; // 1-5
  comment: string | null;
  eventId: number | null;
  createdAt: string;
}

// --- Inquiries ---

export interface VendorInquiryDto {
  id: number;
  vendorProfileId: number;
  userId: number | null;
  contactName: string;
  contactEmail: string;
  message: string;
  eventDate: string | null;
  guestCount: number | null;
  budget: number | null;
  currency: string | null;
  status: number; // InquiryStatus
  eventId: number | null;
  createdAt: string;
  updatedAt: string;
}

// --- Offers ---

export interface VendorOfferItemDto {
  id: number;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
}

export interface VendorOfferDto {
  id: number;
  vendorProfileId: number;
  vendorName: string | null;
  inquiryId: number | null;
  clientUserId: number | null;
  eventId: number | null;
  title: string;
  description: string | null;
  totalPrice: number;
  currency: string;
  validUntil: string | null;
  status: number; // OfferStatus
  items: VendorOfferItemDto[];
  createdAt: string;
  updatedAt: string;
}

// --- Event Vendors ---

export interface EventVendorDto {
  id: number;
  eventId: number;
  vendorProfileId: number;
  organizationName: string;
  serviceCategory: string;
  vendorRating: number | null;
  status: number; // EventVendorStatus
  acceptedOfferId: number | null;
  createdAt: string;
}

export interface EventVendorCompareDto {
  vendorProfileId: number;
  organizationName: string;
  vendorRating: number | null;
  serviceCategory: string;
  offers: VendorOfferDto[];
}

// === Request DTOs ===

/** Create vendor profile */
export interface VendorProfileCreateRequest {
  organizationId: number;
  slug: string;
  displayName: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  serviceCategory: string;
  city?: string;
  region?: string;
  country?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

/** Update vendor profile */
export interface VendorProfileUpdateRequest {
  displayName?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  serviceCategory?: string;
  city?: string;
  region?: string;
  country?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive?: boolean;
}

/** Price list item create/update */
export interface VendorPriceListItemRequest {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  unit?: string;
  sortOrder?: number;
  isAvailable?: boolean;
}

/** Menu item create/update */
export interface VendorMenuItemRequest {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  category?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  allergens?: string;
  imageUrl?: string;
  sortOrder?: number;
  isAvailable?: boolean;
}

/** Portfolio item create */
export interface VendorPortfolioItemRequest {
  title?: string;
  description?: string;
  mediaUrl: string;
  mediaType?: string;
  sortOrder?: number;
}

/** Review create */
export interface VendorReviewCreateRequest {
  rating: number; // 1-5
  comment?: string;
  eventId?: number;
}

/** Inquiry create */
export interface VendorInquiryCreateRequest {
  contactName: string;
  contactEmail: string;
  message: string;
  eventDate?: string;
  guestCount?: number;
  budget?: number;
  currency?: string;
}

/** Offer create */
export interface VendorOfferCreateRequest {
  inquiryId?: number;
  clientUserId?: number;
  eventId?: number;
  title: string;
  description?: string;
  totalPrice: number;
  currency?: string;
  validUntil?: string;
  items: VendorOfferItemRequest[];
}

export interface VendorOfferItemRequest {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
}

/** Event vendor create */
export interface EventVendorCreateRequest {
  eventId: number;
  vendorProfileId: number;
  serviceCategory: string;
}

/** Event vendor status update */
export interface EventVendorStatusRequest {
  status: number;
  acceptedOfferId?: number;
}

/** Inquiry status update */
export interface InquiryStatusRequest {
  status: number;
}

/** Offer respond (accept/reject) */
export interface OfferRespondRequest {
  accept: boolean;
}

/** Vendor list query params */
export interface VendorListParams {
  category?: string;
  city?: string;
  region?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}
