export interface CoverArtImage {
  id?: string;
  types?: string[];
  front?: boolean;
  back?: boolean;
  image: string;
  thumbnails?: {
    small?: string;
    large?: string;
    [key: string]: string | undefined;
  };
  comment?: string;
}

export interface CoverArtRelease {
  id: string;
  release?: string;
  images: CoverArtImage[];
}
