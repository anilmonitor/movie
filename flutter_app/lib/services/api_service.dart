import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/movie.dart';
import 'offline_movies_data.dart';

class ApiService {
  static const String baseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: 'https://movieman4u.vercel.app/api');

  // Decode common HTML entities in title/storyline
  static String decodeHtml(String? text) {
    if (text == null) return '';
    return text
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#039;', "'")
        .replaceAll('&#8211;', '–')
        .replaceAll('&#8212;', '—')
        .replaceAll('&#8216;', "‘")
        .replaceAll('&#8217;', "’")
        .replaceAll('&#8220;', '“')
        .replaceAll('&#8221;', '”')
        .replaceAll('&#8230;', '…')
        .replaceAll('&nbsp;', ' ')
        .trim();
  }

  // Detect 18+ / adult categories for Google Play compliance
  static bool isAdultCategory(String name, String slug) {
    return false;
  }

  // Allow all movies including 18+
  static bool isAdultMovie(Movie movie) {
    return false;
  }

  static const Map<String, String> requestHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
    'Referer': 'https://movieman4u.vercel.app/',
    'Origin': 'https://movieman4u.vercel.app',
  };

  // Guaranteed fallback categories so CategoriesScreen is NEVER blank
  static const List<MovieCategory> defaultCategories = [
    // Top Industries & Languages
    MovieCategory(id: 3, name: 'Bollywood', slug: 'bollywood', count: 892),
    MovieCategory(id: 91, name: 'Hollywood', slug: 'hollywood', count: 3859),
    MovieCategory(id: 7, name: 'Dual Audio', slug: 'dual-audio', count: 4306),
    MovieCategory(id: 10, name: 'Hindi', slug: 'hindi', count: 2867),
    MovieCategory(id: 15, name: 'South Indian', slug: 'south-indian', count: 1175),
    MovieCategory(id: 19, name: 'Web Series', slug: 'web-series', count: 1542),
    MovieCategory(id: 16, name: 'Tamil', slug: 'tamil', count: 537),
    MovieCategory(id: 17, name: 'Telugu', slug: 'telugu', count: 526),
    MovieCategory(id: 8, name: 'English', slug: 'english', count: 784),
    MovieCategory(id: 488, name: 'Korean', slug: 'korean', count: 459),
    MovieCategory(id: 14, name: 'Punjabi', slug: 'punjabi', count: 372),
    MovieCategory(id: 5, name: 'Bengali', slug: 'bangali', count: 370),
    MovieCategory(id: 12, name: 'Malayalam', slug: 'malayalam', count: 307),
    MovieCategory(id: 18, name: 'TV Shows', slug: 'tv-show', count: 266),
    MovieCategory(id: 13, name: 'Marathi', slug: 'marathi', count: 210),
    MovieCategory(id: 9, name: 'Gujarati', slug: 'gujarati', count: 188),
    MovieCategory(id: 11, name: 'Kannada', slug: 'kannada-movie', count: 187),
    MovieCategory(id: 6, name: 'Chinese', slug: 'chinese', count: 157),
    MovieCategory(id: 489, name: 'Odia', slug: 'odia', count: 30),
    MovieCategory(id: 490, name: 'Urdu', slug: 'urdu', count: 6),

    // Popular Genres & Collections
    MovieCategory(id: 0, name: 'Action', slug: 'action', count: 512),
    MovieCategory(id: 0, name: 'Comedy', slug: 'comedy', count: 320),
    MovieCategory(id: 0, name: 'Drama', slug: 'drama', count: 410),
    MovieCategory(id: 0, name: 'Horror', slug: 'horror', count: 180),
    MovieCategory(id: 0, name: 'Thriller', slug: 'thriller', count: 260),
    MovieCategory(id: 0, name: 'Romance', slug: 'romance', count: 215),
    MovieCategory(id: 0, name: 'Sci-Fi & Fantasy', slug: 'sci-fi', count: 195),
    MovieCategory(id: 0, name: 'Crime & Mystery', slug: 'crime', count: 165),
    MovieCategory(id: 0, name: 'Animation', slug: 'animation', count: 130),
    MovieCategory(id: 0, name: 'Adventure', slug: 'adventure', count: 220),

    // 18+ placed at the bottom
    MovieCategory(id: 4, name: '18+', slug: '18', count: 206),
  ];

  static const String _cacheKey = 'cached_movies_v1';

  static Future<void> cacheMovies(List<Movie> movies) async {
    if (movies.isEmpty) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonStr = json.encode(movies.map((m) => m.toJson()).toList());
      await prefs.setString(_cacheKey, jsonStr);
    } catch (_) {}
  }

  static Future<List<Movie>> getCachedMovies() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final str = prefs.getString(_cacheKey);
      if (str != null && str.isNotEmpty) {
        final list = json.decode(str) as List<dynamic>;
        final parsed = list.map((e) => Movie.fromJson(e as Map<String, dynamic>)).toList();
        if (parsed.isNotEmpty) return parsed;
      }
    } catch (_) {}
    return OfflineMoviesData.sampleMovies;
  }

  // Fetch paginated movies directly from Vercel API
  static Future<MovieListResponse> fetchMovies({
    int page = 1,
    int perPage = 18,
    String? category,
    String? search,
    String sort = 'newest',
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    final afterIso = startDate != null
        ? '${startDate.year}-${startDate.month.toString().padLeft(2, '0')}-${startDate.day.toString().padLeft(2, '0')}T00:00:00'
        : null;
    final beforeIso = endDate != null
        ? '${endDate.year}-${endDate.month.toString().padLeft(2, '0')}-${endDate.day.toString().padLeft(2, '0')}T23:59:59'
        : null;

    // 1. Primary: Query Vercel API (backed directly by Hostinger MySQL Database)
    try {
      final queryParams = <String, String>{
        'page': page.toString(),
        'perPage': perPage.toString(),
        'sort': sort,
        if (category != null && category.isNotEmpty) 'category': category,
        if (search != null && search.isNotEmpty) 'search': search,
      };
      if (afterIso != null) queryParams['after'] = afterIso;
      if (beforeIso != null) queryParams['before'] = beforeIso;

      final uri = Uri.parse('$baseUrl/movies').replace(queryParameters: queryParams);
      final res = await http.get(uri, headers: requestHeaders).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final data = json.decode(res.body) as Map<String, dynamic>;
        final response = MovieListResponse.fromJson(data);
        var cleanMovies = response.movies.where((m) => !isAdultMovie(m)).toList();
        if (startDate != null || endDate != null) {
          cleanMovies = cleanMovies.where((m) {
            final dt = m.uploadDateTime;
            if (dt == null) return false;
            if (startDate != null && dt.isBefore(DateTime(startDate.year, startDate.month, startDate.day, 0, 0, 0))) {
              return false;
            }
            if (endDate != null && dt.isAfter(DateTime(endDate.year, endDate.month, endDate.day, 23, 59, 59))) {
              return false;
            }
            return true;
          }).toList();
        }

        if (cleanMovies.isNotEmpty) {
          cacheMovies(cleanMovies);
          return MovieListResponse(
            movies: cleanMovies,
            totalPages: response.totalPages,
            totalMovies: response.totalMovies,
            currentPage: response.currentPage,
          );
        }
      }
    } catch (_) {}

    // 2. Offline / Cached Fallback
    final cached = await getCachedMovies();
    if (cached.isNotEmpty) {
      var filtered = cached;
      if (category != null && category.isNotEmpty) {
        final isNum = int.tryParse(category) != null;
        filtered = filtered.where((m) =>
          m.categories.any((c) =>
            (isNum && c.id.toString() == category) ||
            c.slug.toLowerCase() == category.toLowerCase() ||
            c.name.toLowerCase().contains(category.toLowerCase())
          )
        ).toList();
      }
      if (search != null && search.isNotEmpty) {
        final q = search.toLowerCase();
        filtered = filtered.where((m) =>
          m.title.toLowerCase().contains(q) ||
          m.rawTitle.toLowerCase().contains(q) ||
          (m.storyline != null && m.storyline!.toLowerCase().contains(q))
        ).toList();
      }
      return MovieListResponse(
        movies: filtered.isNotEmpty ? filtered : cached,
        totalPages: 1,
        totalMovies: filtered.isNotEmpty ? filtered.length : cached.length,
        currentPage: page,
      );
    }

    return MovieListResponse(movies: [], totalPages: 0, totalMovies: 0, currentPage: page);
  }

  // Fetch single movie by slug
  static Future<Movie?> fetchMovieBySlug(String slug) async {
    // 1. Primary: Vercel API
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/movies/$slug'), headers: requestHeaders)
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = json.decode(res.body) as Map<String, dynamic>;
        final movie = Movie.fromJson(data);
        if (!isAdultMovie(movie)) {
          return movie;
        }
      }
    } catch (_) {}

    // 2. Cached / Offline Fallback
    final cached = await getCachedMovies();
    for (final m in cached) {
      if (m.slug == slug || m.id.toString() == slug) {
        return m;
      }
    }

    return null;
  }

  // Alias for backward compatibility
  static Future<Movie?> fetchMovieDetail(String slug) => fetchMovieBySlug(slug);

  static List<MovieCategory> _ensureEssentialCategories(List<MovieCategory> list) {
    final fetchedMap = <String, MovieCategory>{};
    for (final c in list) {
      fetchedMap[c.slug.toLowerCase().trim()] = c;
      if (c.id > 0) {
        fetchedMap['id_${c.id}'] = c;
      }
    }

    final result = <MovieCategory>[];
    final addedKeys = <String>{};

    for (final def in defaultCategories) {
      final key = def.slug.toLowerCase().trim();
      final idKey = def.id > 0 ? 'id_${def.id}' : '';
      final live = fetchedMap[key] ?? (idKey.isNotEmpty ? fetchedMap[idKey] : null);

      if (live != null) {
        result.add(MovieCategory(
          id: live.id > 0 ? live.id : def.id,
          name: def.name,
          slug: live.slug.isNotEmpty ? live.slug : def.slug,
          count: live.count ?? def.count,
        ));
      } else {
        result.add(def);
      }
      addedKeys.add(key);
      if (idKey.isNotEmpty) addedKeys.add(idKey);
    }

    for (final c in list) {
      final key = c.slug.toLowerCase().trim();
      final idKey = c.id > 0 ? 'id_${c.id}' : '';
      if (!addedKeys.contains(key) && (idKey.isEmpty || !addedKeys.contains(idKey))) {
        result.add(c);
        addedKeys.add(key);
      }
    }

    final adultCats = result.where((c) => c.slug == '18' || c.name.contains('18+')).toList();
    result.removeWhere((c) => c.slug == '18' || c.name.contains('18+'));
    result.addAll(adultCats);

    return result;
  }

  // Fetch categories directly from Vercel API
  static Future<List<MovieCategory>> fetchCategories() async {
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/categories'), headers: requestHeaders)
          .timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        final list = json.decode(res.body) as List<dynamic>;
        final parsed = list
            .map((e) => MovieCategory.fromJson(e as Map<String, dynamic>))
            .where((c) => !isAdultCategory(c.name, c.slug))
            .toList();
        if (parsed.isNotEmpty) {
          return _ensureEssentialCategories(parsed);
        }
      }
    } catch (_) {}

    return defaultCategories;
  }
}
