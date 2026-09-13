import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/movie.dart';

class ApiService {
  static const String baseUrl = 'https://allmoviesite.vercel.app/api';
  static const String directWpUrl = 'https://movies4u.kg/wp-json/wp/v2';

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
  // 18+ content enabled as requested by user
  static bool isAdultCategory(String name, String slug) {
    return false;
  }

  // Allow all movies including 18+
  static bool isAdultMovie(Movie movie) {
    return false;
  }

  // Parse raw WP post to Movie object (for direct fallback)
  static Movie parseWpPost(Map<String, dynamic> post) {
    final rawTitle = decodeHtml(post['title']?['rendered']?.toString());
    final content = post['content']?['rendered']?.toString() ?? '';

    // Clean title
    String title = rawTitle
        .replaceAll(RegExp(r'\b(480p|720p|1080p|2160p|4K|HQ-HDTC|WEB-DL|Blu-Ray|HDRip|HDCAMRip|HDCAM)\b', caseSensitive: false), '')
        .replaceAll('|', '')
        .replaceAll(RegExp(r'\s*–\s*'), ' - ')
        .replaceAll(RegExp(r'\[.*?Added.*?\]', caseSensitive: false), '')
        .replaceAll(RegExp(r'\{.*?Added.*?\}', caseSensitive: false), '')
        .replaceAll(RegExp(r'\(Season\s*\d+(?:-\d+)?\)', caseSensitive: false), '')
        .replaceAll(RegExp(r'Full Movie', caseSensitive: false), '')
        .replaceAll(RegExp(r'WEB Series', caseSensitive: false), '')
        .trim();

    final nameWithYear = RegExp(r'^(.*?)\s*\(\d{4}\)').firstMatch(title);
    if (nameWithYear != null && (nameWithYear.group(1)?.length ?? 0) > 2) {
      title = nameWithYear.group(1)!.trim();
    }

    // Extract year
    final yearMatch = RegExp(r'\b(19\d{2}|20\d{2})\b').firstMatch(rawTitle) ??
        RegExp(r'Released?\s*Year:\s*([^\n<]+)', caseSensitive: false).firstMatch(content);
    final year = yearMatch?.group(1)?.trim();

    // Extract rating
    final ratingMatch = RegExp(r'IMDb\s*Rating:?-?\s*([0-9.]+(?:\/10)?)', caseSensitive: false).firstMatch(content);
    final rating = ratingMatch?.group(1)?.replaceAll('/10', '');

    // Extract qualities
    final qualities = <String>[];
    final qMatches = RegExp(r'\b(480p|720p|1080p|2160p|4K|HQ-HDTC|WEB-DL)\b', caseSensitive: false).allMatches(rawTitle);
    for (final m in qMatches) {
      final q = m.group(0)!.toUpperCase();
      if (!qualities.contains(q)) qualities.add(q);
    }

    // Extract languages
    final langMatch = RegExp(r'Language:\s*([^\n<]+)', caseSensitive: false).firstMatch(content);
    final languages = <String>[];
    if (langMatch != null) {
      final lStr = langMatch.group(1) ?? '';
      languages.addAll(lStr.split(RegExp(r'[,|+]')).map((e) => e.trim()).where((e) => e.isNotEmpty));
    }

    // Extract storyline
    String? storyline;
    final storyMatch = RegExp(r'Storyline:<\/h2>\s*<p>(.*?)<\/p>', caseSensitive: false).firstMatch(content) ??
        RegExp(r'Storyline:<\/h2>\s*([^<]+)', caseSensitive: false).firstMatch(content);
    if (storyMatch != null) {
      storyline = decodeHtml(storyMatch.group(1)?.replaceAll(RegExp(r'<[^>]+>'), '').trim());
    }

    // Extract poster
    String poster = '';
    try {
      final embedded = post['_embedded'] as Map<String, dynamic>?;
      final media = embedded?['wp:featuredmedia'] as List<dynamic>?;
      if (media != null && media.isNotEmpty) {
        poster = media[0]['source_url']?.toString() ?? '';
      }
    } catch (_) {}

    // Extract screenshots
    final screenshots = <String>[];
    final imgMatches = RegExp(r'<img\s+[^>]*src=["\x27]([^"\x27]+)["\x27]', caseSensitive: false).allMatches(content);
    for (final m in imgMatches) {
      final src = m.group(1) ?? '';
      if (src.isNotEmpty && !src.contains('gravatar') && !src.contains('emoji') && !screenshots.contains(src)) {
        screenshots.add(src);
      }
    }

    // Extract download links
    final downloadLinks = <DownloadLink>[];
    final blockMatches = RegExp(r'<h[34][^>]*>(.*?)<\/h[34]>([\s\S]*?)(?=<h[34]|$)', caseSensitive: false).allMatches(content);
    for (final b in blockMatches) {
      final heading = decodeHtml(b.group(1)?.replaceAll(RegExp(r'<[^>]+>'), '').trim());
      final blockHtml = b.group(2) ?? '';
      final aMatches = RegExp(r'<a\s+[^>]*href=["\x27]([^"\x27]+)["\x27][^>]*>(?:<button[^>]*>)?([\s\S]*?)(?:<\/button>)?<\/a>', caseSensitive: false).allMatches(blockHtml);

      for (final a in aMatches) {
        final url = a.group(1)?.trim() ?? '';
        final aText = decodeHtml(a.group(2)?.replaceAll(RegExp(r'<[^>]+>'), '').trim());
        if (url.isNotEmpty && !url.contains('t.me') && !url.contains('how-to-download') && !url.startsWith('#')) {
          final title = (aText.isNotEmpty && !aText.toLowerCase().contains('download'))
              ? (heading.isNotEmpty ? '$heading - $aText' : aText)
              : (heading.isNotEmpty ? heading : (aText.isNotEmpty ? aText : 'Download Now'));
          final qMatch = RegExp(r'\b(480p|720p|1080p|2160p|4K)\b', caseSensitive: false).firstMatch('$title $url');
          final sMatch = RegExp(r'\[([0-9.]+(?:MB|GB)(?:\/[A-Za-z]+)?)\]', caseSensitive: false).firstMatch('$title $url');

          downloadLinks.add(DownloadLink(
            title: title,
            url: url,
            quality: qMatch?.group(1),
            size: sMatch?.group(1),
          ));
        }
      }
    }

    if (downloadLinks.isEmpty) {
      final fallbackMatches = RegExp(r'<a\s+[^>]*href=["\x27]([^"\x27]+)["\x27][^>]*>(?:<button[^>]*>)?([\s\S]*?)(?:<\/button>)?<\/a>', caseSensitive: false).allMatches(content);
      for (final a in fallbackMatches) {
        final url = a.group(1)?.trim() ?? '';
        final text = decodeHtml(a.group(2)?.replaceAll(RegExp(r'<[^>]+>'), '').trim());
        if ((text.toLowerCase().contains('download') ||
                text.toLowerCase().contains('batch') ||
                text.toLowerCase().contains('zip') ||
                text.toLowerCase().contains('part') ||
                text.toLowerCase().contains('episode')) &&
            !url.contains('how-to-download') &&
            !url.contains('t.me') &&
            !url.startsWith('#')) {
          final qMatch = RegExp(r'\b(480p|720p|1080p|2160p|4K)\b', caseSensitive: false).firstMatch(text);
          final sMatch = RegExp(r'\[([0-9.]+(?:MB|GB)(?:\/[A-Za-z]+)?)\]', caseSensitive: false).firstMatch(text);
          downloadLinks.add(DownloadLink(
            title: text.isNotEmpty ? text : 'Download Now',
            url: url,
            quality: qMatch?.group(1),
            size: sMatch?.group(1),
          ));
        }
      }
    }

    // Extract categories
    final categories = <MovieCategory>[];
    try {
      final embedded = post['_embedded'] as Map<String, dynamic>?;
      final terms = embedded?['wp:term'] as List<dynamic>?;
      if (terms != null && terms.isNotEmpty) {
        final catList = terms[0] as List<dynamic>?;
        if (catList != null) {
          for (final c in catList) {
            final catName = decodeHtml(c['name']?.toString());
            final catSlug = c['slug']?.toString() ?? '';
            if (!isAdultCategory(catName, catSlug)) {
              categories.add(MovieCategory(
                id: c['id'] as int? ?? 0,
                name: catName,
                slug: catSlug,
              ));
            }
          }
        }
      }
    } catch (_) {}

    return Movie(
      id: post['id'] as int? ?? 0,
      slug: post['slug']?.toString() ?? '',
      title: title.isEmpty ? rawTitle : title,
      rawTitle: rawTitle,
      year: year,
      rating: rating,
      languages: languages,
      qualities: qualities.isNotEmpty ? qualities : ['HD'],
      storyline: storyline,
      poster: poster,
      screenshots: screenshots,
      downloadLinks: downloadLinks,
      categories: categories,
      date: post['date']?.toString() ?? '',
    );
  }

  static const Map<String, String> requestHeaders = {
    'User-Agent':
        'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
  };

  // Guaranteed fallback categories so CategoriesScreen is NEVER blank
  static const List<MovieCategory> defaultCategories = [
    // Top Industries & Languages (Real WordPress Categories with live IDs)
    MovieCategory(id: 4, name: '18+', slug: '18', count: 206),
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
  ];

  // Fetch paginated movies
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

    // 1. Try Vercel API
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
      final res = await http.get(uri, headers: requestHeaders).timeout(const Duration(seconds: 8));

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
          return MovieListResponse(
            movies: cleanMovies,
            totalPages: response.totalPages,
            totalMovies: response.totalMovies,
            currentPage: response.currentPage,
          );
        }
      }
    } catch (_) {}

    // 2. Direct Fallback to WordPress REST API
    try {
      final isNumeric = category != null && int.tryParse(category) != null;
      final params = <String, String>{
        '_embed': '1',
        'page': page.toString(),
        'per_page': perPage.toString(),
        'orderby': 'date',
        'order': sort == 'oldest' ? 'asc' : 'desc',
        if (isNumeric) 'categories': category,
        if (search != null && search.isNotEmpty)
          'search': search
        else if (category != null && !isNumeric)
          'search': category,
      };
      if (afterIso != null) params['after'] = afterIso;
      if (beforeIso != null) params['before'] = beforeIso;

      final uri = Uri.parse('$directWpUrl/posts').replace(queryParameters: params);
      final res = await http.get(uri, headers: requestHeaders).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        final totalMovies = int.tryParse(res.headers['x-wp-total'] ?? '0') ?? 0;
        final totalPages = int.tryParse(res.headers['x-wp-totalpages'] ?? '1') ?? 1;

        final list = json.decode(res.body) as List<dynamic>;
        var movies = list
            .map((e) => parseWpPost(e as Map<String, dynamic>))
            .where((m) => !isAdultMovie(m))
            .toList();

        if (startDate != null || endDate != null) {
          movies = movies.where((m) {
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

        return MovieListResponse(
          movies: movies,
          totalPages: totalPages,
          totalMovies: totalMovies,
          currentPage: page,
        );
      }
    } catch (_) {}

    return MovieListResponse(movies: [], totalPages: 0, totalMovies: 0, currentPage: page);
  }

  // Fetch single movie by slug
  static Future<Movie?> fetchMovieBySlug(String slug) async {
    // 1. Try Vercel API
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/movies/$slug'), headers: requestHeaders)
          .timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        final data = json.decode(res.body) as Map<String, dynamic>;
        final movie = Movie.fromJson(data);
        if (!isAdultMovie(movie)) {
          return movie;
        }
      }
    } catch (_) {}

    // 2. Fallback direct to WP
    try {
      final res = await http
          .get(
            Uri.parse('$directWpUrl/posts?slug=${Uri.encodeComponent(slug)}&_embed=1'),
            headers: requestHeaders,
          )
          .timeout(const Duration(seconds: 12));
      if (res.statusCode == 200) {
        final list = json.decode(res.body) as List<dynamic>;
        if (list.isNotEmpty) {
          final movie = parseWpPost(list[0] as Map<String, dynamic>);
          if (!isAdultMovie(movie)) {
            return movie;
          }
        }
      }
    } catch (_) {}

    return null;
  }

  // Alias for backward compatibility
  static Future<Movie?> fetchMovieDetail(String slug) => fetchMovieBySlug(slug);

  static List<MovieCategory> _ensureEssentialCategories(List<MovieCategory> list) {
    // Map of slug and id to live fetched categories
    final fetchedMap = <String, MovieCategory>{};
    for (final c in list) {
      fetchedMap[c.slug.toLowerCase().trim()] = c;
      if (c.id > 0) {
        fetchedMap['id_${c.id}'] = c;
      }
    }

    final result = <MovieCategory>[];
    final addedKeys = <String>{};

    // 1. Populate all default categories with updated live counts from fetchedMap
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

    // 2. Add any newly discovered categories from WordPress that weren't in defaultCategories
    for (final c in list) {
      final key = c.slug.toLowerCase().trim();
      final idKey = c.id > 0 ? 'id_${c.id}' : '';
      if (!addedKeys.contains(key) && (idKey.isEmpty || !addedKeys.contains(idKey))) {
        result.add(c);
        addedKeys.add(key);
      }
    }

    return result;
  }

  // Fetch categories
  static Future<List<MovieCategory>> fetchCategories() async {
    // 1. Direct fetch from WordPress (fast & reliable)
    try {
      final res = await http
          .get(Uri.parse('$directWpUrl/categories?per_page=100'), headers: requestHeaders)
          .timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        final list = json.decode(res.body) as List<dynamic>;
        final parsed = list
            .where((e) => (e['count'] as int? ?? 0) > 0 && e['slug'] != 'uncategorized')
            .map((e) => MovieCategory(
                  id: e['id'] as int? ?? 0,
                  name: decodeHtml(e['name']?.toString()),
                  slug: e['slug']?.toString() ?? '',
                  count: e['count'] as int?,
                ))
            .where((c) => !isAdultCategory(c.name, c.slug))
            .toList();
        if (parsed.isNotEmpty) {
          return _ensureEssentialCategories(parsed);
        }
      }
    } catch (_) {}

    // 2. Fallback to Vercel API
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/categories'), headers: requestHeaders)
          .timeout(const Duration(seconds: 6));
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

    // 3. Fallback to guaranteed default categories so screen is NEVER empty
    return defaultCategories;
  }
}
