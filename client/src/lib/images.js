const IMG_BASE = 'https://image.tmdb.org/t/p';

export function posterUrl(posterPath, width = 342) {
  return posterPath ? `${IMG_BASE}/w${width}${posterPath}` : null;
}

export function backdropUrl(backdropPath, width = 780) {
  return backdropPath ? `${IMG_BASE}/w${width}${backdropPath}` : null;
}
