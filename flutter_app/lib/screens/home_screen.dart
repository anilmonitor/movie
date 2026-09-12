import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/horizontal_movie_list.dart';
import '../widgets/movie_card.dart';
import '../widgets/shimmer_loading.dart';
import 'category_detail_screen.dart';
import 'search_screen.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onToggleTheme;

  const HomeScreen({super.key, required this.onToggleTheme});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Movie> _allMovies = [];
  List<Movie> _bollywoodMovies = [];
  List<Movie> _hollywoodMovies = [];
  List<Movie> _dualAudioMovies = [];
  List<Movie> _webSeries = [];

  bool _isLoading = true;
  bool _isLoadingMore = false;
  int _currentPage = 1;
  int _totalPages = 1;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadAllData();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 300 &&
        !_isLoadingMore &&
        _currentPage < _totalPages) {
      _loadMore();
    }
  }

  Future<void> _loadAllData() async {
    setState(() => _isLoading = true);

    try {
      final results = await Future.wait([
        ApiService.fetchMovies(page: 1, perPage: 18),
        ApiService.fetchMovies(category: '3', perPage: 8), // Bollywood
        ApiService.fetchMovies(category: '91', perPage: 8), // Hollywood
        ApiService.fetchMovies(category: '7', perPage: 8), // Dual Audio
        ApiService.fetchMovies(category: '19', perPage: 8), // Web Series
      ]);

      if (mounted) {
        setState(() {
          _allMovies = results[0].movies;
          _currentPage = results[0].currentPage;
          _totalPages = results[0].totalPages;

          _bollywoodMovies = results[1].movies;
          _hollywoodMovies = results[2].movies;
          _dualAudioMovies = results[3].movies;
          _webSeries = results[4].movies;

          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadMore() async {
    setState(() => _isLoadingMore = true);
    final res = await ApiService.fetchMovies(page: _currentPage + 1, perPage: 18);
    if (mounted) {
      setState(() {
        _allMovies.addAll(res.movies);
        _currentPage = res.currentPage;
        _totalPages = res.totalPages;
        _isLoadingMore = false;
      });
    }
  }

  bool _sortNewestFirst = true;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final sortedMovies = List<Movie>.from(_allMovies)..sort((a, b) {
      final timeA = a.uploadDateTime?.millisecondsSinceEpoch ?? 0;
      final timeB = b.uploadDateTime?.millisecondsSinceEpoch ?? 0;
      return _sortNewestFirst ? timeB.compareTo(timeA) : timeA.compareTo(timeB);
    });

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.asset(
                'assets/images/logo.png',
                width: 32,
                height: 32,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryRed,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 20),
                ),
              ),
            ),
            const SizedBox(width: 8),
            RichText(
              text: TextSpan(
                text: 'MOVIE ',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: isDark ? Colors.white : AppTheme.lightTextPrimary,
                  letterSpacing: 0.5,
                ),
                children: const [
                  TextSpan(
                    text: 'MAN',
                    style: TextStyle(color: AppTheme.primaryRed, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Theme Toggle Button
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
              color: isDark ? AppTheme.ratingGold : Colors.black87,
              size: 22,
            ),
            tooltip: 'Toggle Theme',
            onPressed: widget.onToggleTheme,
          ),

          // Search Button
          IconButton(
            icon: Icon(Icons.search_rounded, color: isDark ? Colors.white : Colors.black87, size: 22),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SearchScreen()),
              );
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: _isLoading
          ? ListView(
              children: const [
                ShimmerBox(width: double.infinity, height: 350, borderRadius: 0),
                SizedBox(height: 20),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: ShimmerBox(width: 150, height: 18, borderRadius: 4),
                ),
                SizedBox(height: 12),
                SizedBox(
                  height: 240,
                  child: Row(
                    children: [
                      SizedBox(width: 16),
                      SizedBox(width: 130, child: ShimmerMovieCard()),
                      SizedBox(width: 12),
                      SizedBox(width: 130, child: ShimmerMovieCard()),
                    ],
                  ),
                ),
              ],
            )
          : RefreshIndicator(
              onRefresh: _loadAllData,
              color: AppTheme.primaryRed,
              child: SingleChildScrollView(
                controller: _scrollController,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top Hero Banner
                    HeroCarousel(movies: _allMovies),
                    const SizedBox(height: 24),

                    // Bollywood Row
                    if (_bollywoodMovies.isNotEmpty)
                      HorizontalMovieList(
                        title: 'Bollywood Hits',
                        movies: _bollywoodMovies,
                        onSeeAll: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CategoryDetailScreen(
                                category: MovieCategory(id: 3, name: 'Bollywood', slug: 'bollywood'),
                              ),
                            ),
                          );
                        },
                      ),
                    const SizedBox(height: 20),

                    // Hollywood Row
                    if (_hollywoodMovies.isNotEmpty)
                      HorizontalMovieList(
                        title: 'Hollywood Cinema',
                        movies: _hollywoodMovies,
                        onSeeAll: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CategoryDetailScreen(
                                category: MovieCategory(id: 91, name: 'Hollywood', slug: 'hollywood'),
                              ),
                            ),
                          );
                        },
                      ),
                    const SizedBox(height: 20),

                    // Dual Audio Row
                    if (_dualAudioMovies.isNotEmpty)
                      HorizontalMovieList(
                        title: 'Hindi Dubbed & Dual Audio',
                        movies: _dualAudioMovies,
                        onSeeAll: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CategoryDetailScreen(
                                category: MovieCategory(id: 7, name: 'Dual Audio', slug: 'dual-audio'),
                              ),
                            ),
                          );
                        },
                      ),
                    const SizedBox(height: 20),

                    // Web Series Row
                    if (_webSeries.isNotEmpty)
                      HorizontalMovieList(
                        title: 'Top Web Series',
                        movies: _webSeries,
                        onSeeAll: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => CategoryDetailScreen(
                                category: MovieCategory(id: 19, name: 'Web Series', slug: 'web-series'),
                              ),
                            ),
                          );
                        },
                      ),
                    const SizedBox(height: 24),

                    // All Releases Section Header with Date Filter
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 3.5,
                                height: 16,
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryRed,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'All Releases',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                                ),
                              ),
                            ],
                          ),

                          // Date Filter Chip Toggle
                          GestureDetector(
                            onTap: () {
                              setState(() {
                                _sortNewestFirst = !_sortNewestFirst;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0xFF1B2232) : Colors.grey[200],
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: AppTheme.primaryRed.withOpacity(0.35),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    _sortNewestFirst ? Icons.access_time_filled_rounded : Icons.history_rounded,
                                    size: 13,
                                    color: AppTheme.primaryRed,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _sortNewestFirst ? 'Newest First' : 'Oldest First',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? Colors.white : Colors.black87,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Grid of All Movies (Date Sorted)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          childAspectRatio: 2 / 3.4,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: sortedMovies.length + (_isLoadingMore ? 3 : 0),
                        itemBuilder: (context, index) {
                          if (index >= sortedMovies.length) {
                            return const ShimmerMovieCard();
                          }
                          return MovieCard(movie: sortedMovies[index]);
                        },
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }
}
