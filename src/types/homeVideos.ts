export interface VideoMetadata {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number;
  available: boolean;
}
export interface HomeVideo {
  id: string;
  videoId: string;
  published: boolean;
  position: number;
  createdAt: string;
  title: string | null;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  available: boolean;
  checkedAt: string | null;
}
export interface VideoBoard { revision: number; videos: HomeVideo[] }
export interface SaveVideo { url: string; published: boolean; revision: number }
