export type MediaType = "image" | "video";

export interface Album {
  id: string;
  title: string;
  description: string | null;
  cover_key: string | null;
  created_at: string;
}

export interface Media {
  id: string;
  album_id: string;
  type: MediaType;
  title: string | null;
  taken_at: string | null;
  display_key: string;
  original_key: string;
  width: number | null;
  height: number | null;
  duration: number | null;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

/** One asset the client wants a presigned PUT for. */
export interface PresignItem {
  target: "web" | "vault";
  contentType: string;
  ext: string;
}

export interface PresignResult {
  target: "web" | "vault";
  key: string;
  url: string;
}
