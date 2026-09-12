import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/movie.dart';

class WatchlistService {
  static const String _key = 'movies4u_watchlist';

  static Future<List<Movie>> getWatchlist() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList(_key) ?? [];
      return list.map((item) => Movie.fromJson(json.decode(item) as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }

  static Future<bool> isInWatchlist(int movieId) async {
    try {
      final movies = await getWatchlist();
      return movies.any((m) => m.id == movieId);
    } catch (_) {
      return false;
    }
  }

  static Future<bool> toggleWatchlist(Movie movie) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final movies = await getWatchlist();
      final index = movies.indexWhere((m) => m.id == movie.id);

      if (index >= 0) {
        movies.removeAt(index);
      } else {
        movies.insert(0, movie);
      }

      final encoded = movies.map((m) => json.encode(m.toJson())).toList();
      await prefs.setStringList(_key, encoded);
      return index < 0; // returns true if added, false if removed
    } catch (_) {
      return false;
    }
  }
}
