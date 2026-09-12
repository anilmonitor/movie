class DownloadLink {
  final String title;
  final String url;
  final String? quality;
  final String? size;

  DownloadLink({
    required this.title,
    required this.url,
    this.quality,
    this.size,
  });

  factory DownloadLink.fromJson(Map<String, dynamic> json) {
    return DownloadLink(
      title: json['title'] as String? ?? 'Download Now',
      url: json['url'] as String? ?? '',
      quality: json['quality'] as String?,
      size: json['size'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'title': title,
        'url': url,
        'quality': quality,
        'size': size,
      };
}

class MovieCategory {
  final int id;
  final String name;
  final String slug;
  final int? count;

  const MovieCategory({
    required this.id,
    required this.name,
    required this.slug,
    this.count,
  });

  factory MovieCategory.fromJson(Map<String, dynamic> json) {
    return MovieCategory(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      count: json['count'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'count': count,
      };
}

class Movie {
  final int id;
  final String slug;
  final String title;
  final String rawTitle;
  final String? year;
  final String? rating;
  final List<String> languages;
  final List<String> qualities;
  final String? size;
  final String? storyline;
  final String poster;
  final List<String> screenshots;
  final List<DownloadLink> downloadLinks;
  final List<MovieCategory> categories;
  final String date;

  Movie({
    required this.id,
    required this.slug,
    required this.title,
    required this.rawTitle,
    this.year,
    this.rating,
    this.languages = const [],
    this.qualities = const [],
    this.size,
    this.storyline,
    required this.poster,
    this.screenshots = const [],
    this.downloadLinks = const [],
    this.categories = const [],
    required this.date,
  });

  factory Movie.fromJson(Map<String, dynamic> json) {
    return Movie(
      id: json['id'] as int? ?? 0,
      slug: json['slug'] as String? ?? '',
      title: json['title'] as String? ?? '',
      rawTitle: json['rawTitle'] as String? ?? json['title'] as String? ?? '',
      year: json['year'] as String?,
      rating: json['rating'] as String?,
      languages: (json['languages'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      qualities: (json['qualities'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          ['HD'],
      size: json['size'] as String?,
      storyline: json['storyline'] as String?,
      poster: json['poster'] as String? ?? '',
      screenshots: (json['screenshots'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      downloadLinks: (json['downloadLinks'] as List<dynamic>?)
              ?.map((e) => DownloadLink.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      categories: (json['categories'] as List<dynamic>?)
              ?.map((e) => MovieCategory.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      date: json['date'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'slug': slug,
        'title': title,
        'rawTitle': rawTitle,
        'year': year,
        'rating': rating,
        'languages': languages,
        'qualities': qualities,
        'size': size,
        'storyline': storyline,
        'poster': poster,
        'screenshots': screenshots,
        'downloadLinks': downloadLinks.map((e) => e.toJson()).toList(),
        'categories': categories.map((e) => e.toJson()).toList(),
        'date': date,
      };

  DateTime? get uploadDateTime {
    if (date.isEmpty) return null;
    try {
      return DateTime.parse(date);
    } catch (_) {
      return null;
    }
  }

  String get formattedUploadDate {
    final dt = uploadDateTime;
    if (dt == null) return '';
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final month = months[dt.month - 1];
    final day = dt.day.toString().padLeft(2, '0');
    final year = dt.year;
    final hour = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final minute = dt.minute.toString().padLeft(2, '0');
    final period = dt.hour >= 12 ? 'PM' : 'AM';
    return '$day $month $year, $hour:$minute $period';
  }

  String get timeAgo {
    final dt = uploadDateTime;
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inDays > 30) {
      final months = (diff.inDays / 30).floor();
      return '${months}mo ago';
    } else if (diff.inDays > 0) {
      return '${diff.inDays}d ago';
    } else if (diff.inHours > 0) {
      return '${diff.inHours}h ago';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}

class MovieListResponse {
  final List<Movie> movies;
  final int totalPages;
  final int totalMovies;
  final int currentPage;

  MovieListResponse({
    required this.movies,
    required this.totalPages,
    required this.totalMovies,
    required this.currentPage,
  });

  factory MovieListResponse.fromJson(Map<String, dynamic> json) {
    return MovieListResponse(
      movies: (json['movies'] as List<dynamic>?)
              ?.map((e) => Movie.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      totalPages: json['totalPages'] as int? ?? 1,
      totalMovies: json['totalMovies'] as int? ?? 0,
      currentPage: json['currentPage'] as int? ?? 1,
    );
  }
}
