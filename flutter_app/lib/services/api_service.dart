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
    final linkMatches = RegExp(r'<h[34][^>]*>(.*?)<\/h[34]>[\s\S]*?<a\s+[^>]*href=["\x27]([^"\x27]+)["\x27]', caseSensitive: false).allMatches(content);
    for (final m in linkMatches) {
      final heading = decodeHtml(m.group(1)?.replaceAll(RegExp(r'<[^>]+>'), '').trim());
      final url = m.group(2) ?? '';
      final qMatch = RegExp(r'\b(480p|720p|1080p|2160p|4K)\b', caseSensitive: false).firstMatch(heading);
      final sMatch = RegExp(r'\[([0-9.]+(?:MB|GB)(?:\/[A-Za-z]+)?)\]', caseSensitive: false).firstMatch(heading);

      if (url.isNotEmpty && !url.contains('t.me') && !url.contains('how-to-download')) {
        downloadLinks.add(DownloadLink(
          title: heading,
          url: url,
          quality: qMatch?.group(1),
          size: sMatch?.group(1),
        ));
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
            categories.add(MovieCategory(
              id: c['id'] as int? ?? 0,
              name: decodeHtml(c['name']?.toString()),
              slug: c['slug']?.toString() ?? '',
            ));
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
    MovieCategory(id: 1, name: 'Bollywood Movies', slug: 'bollywood', count: 450),
    MovieCategory(id: 2, name: 'Hollywood Movies', slug: 'hollywood', count: 620),
    MovieCategory(id: 3, name: 'Dual Audio (Hindi)', slug: 'dual-audio', count: 580),
    MovieCategory(id: 4, name: 'South Indian Hindi', slug: 'south-indian', count: 340),
    MovieCategory(id: 5, name: 'Web Series & TV', slug: 'web-series', count: 290),
    MovieCategory(id: 6, name: 'Hindi Dubbed', slug: 'hindi-dubbed', count: 410),
    MovieCategory(id: 7, name: 'Action', slug: 'action', count: 512),
    MovieCategory(id: 8, name: 'Comedy', slug: 'comedy', count: 320),
    MovieCategory(id: 9, name: 'Drama', slug: 'drama', count: 410),
    MovieCategory(id: 10, name: 'Horror', slug: 'horror', count: 180),
    MovieCategory(id: 11, name: 'Thriller', slug: 'thriller', count: 260),
    MovieCategory(id: 12, name: 'Romance', slug: 'romance', count: 215),
    MovieCategory(id: 13, name: 'Sci-Fi & Fantasy', slug: 'sci-fi', count: 195),
    MovieCategory(id: 14, name: 'Crime & Mystery', slug: 'crime', count: 165),
    MovieCategory(id: 15, name: 'Korean & Asian', slug: 'korean', count: 140),
    MovieCategory(id: 16, name: 'Animation', slug: 'animation', count: 130),
    MovieCategory(id: 17, name: 'Adventure', slug: 'adventure', count: 220),
  ];

  // Fetch paginated movies
  static Future<MovieListResponse> fetchMovies({
    int page = 1,
    int perPage = 18,
    String? category,
    String? search,
  }) async {
    // 1. Try Vercel API
    try {
      final queryParams = {
        'page': page.toString(),
        'perPage': perPage.toString(),
        if (category != null && category.isNotEmpty) 'category': category,
        if (search != null && search.isNotEmpty) 'search': search,
      };

      final uri = Uri.parse('$baseUrl/movies').replace(queryParameters: queryParams);
      final res = await http.get(uri, headers: requestHeaders).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = json.decode(res.body) as Map<String, dynamic>;
        final response = MovieListResponse.fromJson(data);
        if (response.movies.isNotEmpty) {
          return response;
        }
      }
    } catch (_) {}

    // 2. Direct Fallback to WordPress REST API
    try {
      final isNumeric = category != null && int.tryParse(category) != null;
      final params = {
        '_embed': '1',
        'page': page.toString(),
        'per_page': perPage.toString(),
        if (isNumeric) 'categories': category,
        if (search != null && search.isNotEmpty)
          'search': search
        else if (category != null && !isNumeric)
          'search': category,
      };

      final uri = Uri.parse('$directWpUrl/posts').replace(queryParameters: params);
      final res = await http.get(uri, headers: requestHeaders).timeout(const Duration(seconds: 12));

      if (res.statusCode == 200) {
        final totalMovies = int.tryParse(res.headers['x-wp-total'] ?? '0') ?? 0;
        final totalPages = int.tryParse(res.headers['x-wp-totalpages'] ?? '1') ?? 1;

        final list = json.decode(res.body) as List<dynamic>;
        final movies = list.map((e) => parseWpPost(e as Map<String, dynamic>)).toList();

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
        return Movie.fromJson(data);
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
          return parseWpPost(list[0] as Map<String, dynamic>);
        }
      }
    } catch (_) {}

    return null;
  }

  // Alias for backward compatibility
  static Future<Movie?> fetchMovieDetail(String slug) => fetchMovieBySlug(slug);

  // Fetch categories
  static Future<List<MovieCategory>> fetchCategories() async {
    // 1. Try Vercel API
    try {
      final res = await http
          .get(Uri.parse('$baseUrl/categories'), headers: requestHeaders)
          .timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final list = json.decode(res.body) as List<dynamic>;
        final parsed = list.map((e) => MovieCategory.fromJson(e as Map<String, dynamic>)).toList();
        if (parsed.isNotEmpty) {
          return parsed;
        }
      }
    } catch (_) {}

    // 2. Fallback to WP
    try {
      final res = await http
          .get(Uri.parse('$directWpUrl/categories?per_page=100'), headers: requestHeaders)
          .timeout(const Duration(seconds: 10));
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
            .toList();
        if (parsed.isNotEmpty) {
          return parsed;
        }
      }
    } catch (_) {}

    // 3. Fallback to guaranteed default categories so screen is NEVER empty
    return defaultCategories;
  }
}
