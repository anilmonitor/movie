export interface DownloadLink {
  title: string;
  url: string;
  quality?: string;
  size?: string;
}

export interface MovieCategory {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

export interface Movie {
  id: number;
  slug: string;
  title: string;
  rawTitle: string;
  year?: string;
  rating?: string;
  languages?: string[];
  qualities?: string[];
  size?: string;
  storyline?: string;
  poster: string;
  screenshots: string[];
  downloadLinks: DownloadLink[];
  categories: MovieCategory[];
  date: string;
  contentHtml?: string;
}

export interface MovieListResponse {
  movies: Movie[];
  totalPages: number;
  totalMovies: number;
  currentPage: number;
}
