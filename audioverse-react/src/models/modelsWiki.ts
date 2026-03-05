// modelsWiki.ts — Wiki DTOs for the AudioVerse Wiki API

// === Response DTOs ===

export interface WikiPageListDto {
  id: number;
  slug: string;
  title: string;
  category: string;
  sortOrder: number;
  parentId: number | null;
  isPublished: boolean;
  tags: string | null;
  icon: string | null;
  updatedAt: string; // ISO 8601
}

export interface WikiPageFullDto {
  id: number;
  slug: string;
  title: string;
  contentMarkdown: string;
  category: string;
  sortOrder: number;
  parentId: number | null;
  isPublished: boolean;
  tags: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  lastEditedByUserId: number | null;
  breadcrumbs: WikiBreadcrumbDto[] | null;
  children: WikiNavItemDto[] | null;
}

export interface WikiNavCategoryDto {
  category: string;
  pages: WikiNavItemDto[];
}

export interface WikiNavItemDto {
  id: number;
  slug: string;
  title: string;
  parentId: number | null;
  icon: string | null;
  sortOrder: number;
  children?: WikiNavItemDto[];
}

export interface WikiBreadcrumbDto {
  slug: string;
  title: string;
}

export interface WikiSearchResultDto {
  id: number;
  slug: string;
  title: string;
  category: string;
  tags: string | null;
  snippet: string;
}

export interface WikiCategoryDto {
  category: string;
  pageCount: number;
}

export interface WikiRevisionListDto {
  id: number;
  revisionNumber: number;
  editSummary: string | null;
  editedByUserId: number | null;
  createdAt: string;
}

export interface WikiRevisionDto {
  id: number;
  wikiPageId: number;
  revisionNumber: number;
  title: string;
  contentMarkdown: string;
  editSummary: string | null;
  editedByUserId: number | null;
  createdAt: string;
}

// === Request DTOs ===

export interface WikiPageCreateRequest {
  slug: string;
  title: string;
  contentMarkdown?: string;
  category?: string;
  sortOrder?: number;
  parentId?: number;
  isPublished?: boolean;
  tags?: string;
  icon?: string;
}

export interface WikiPageUpdateRequest {
  title?: string;
  contentMarkdown?: string;
  category?: string;
  sortOrder?: number;
  parentId?: number;   // 0 = detach (null)
  isPublished?: boolean;
  tags?: string;
  icon?: string;
  editSummary?: string;
}

export interface WikiReorderItem {
  id: number;
  sortOrder: number;
  parentId?: number;   // 0 = null
}
