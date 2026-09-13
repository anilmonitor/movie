import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/movie.dart';
import '../theme/app_theme.dart';
import '../screens/movie_detail_screen.dart';
import 'download_sheet.dart';

class HeroCarousel extends StatefulWidget {
  final List<Movie> movies;

  const HeroCarousel({super.key, required this.movies});

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  late PageController _pageController;
  int _currentPage = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoSlide();
  }

  void _startAutoSlide() {
    _timer = Timer.periodic(const Duration(seconds: 6), (timer) {
      if (!mounted || widget.movies.isEmpty) return;
      if (_currentPage < widget.movies.take(5).length - 1) {
        _currentPage++;
      } else {
        _currentPage = 0;
      }
      _pageController.animateToPage(
        _currentPage,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final featured = widget.movies.take(5).toList();
    if (featured.isEmpty) return const SizedBox.shrink();

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      children: [
        SizedBox(
          height: 380,
          child: PageView.builder(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentPage = index),
            itemCount: featured.length,
            itemBuilder: (context, index) {
              final movie = featured[index];
              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => MovieDetailScreen(movie: movie)),
                  );
                },
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Backdrop Image
                    CachedNetworkImage(
                      imageUrl: movie.poster,
                      fit: BoxFit.cover,
                      alignment: Alignment.topCenter,
                      errorWidget: (_, __, ___) => Container(color: Colors.grey[900]),
                    ),

                    // Multi-layer Gradient Fade
                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withOpacity(0.4),
                              isDark ? AppTheme.darkBackground : AppTheme.lightBackground.withOpacity(0.95),
                            ],
                            stops: const [0.3, 0.65, 1.0],
                          ),
                        ),
                      ),
                    ),

                    // Content Overlay
                    Positioned(
                      bottom: 20,
                      left: 16,
                      right: 16,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Top Badges
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryRed,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.flash_on_rounded, color: Colors.white, size: 12),
                                    SizedBox(width: 3),
                                    Text(
                                      'TRENDING',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (movie.rating != null) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppTheme.ratingGold,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.star, color: Colors.black, size: 11),
                                      const SizedBox(width: 2),
                                      Text(
                                        movie.rating!,
                                        style: const TextStyle(
                                          color: Colors.black,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              if (movie.year != null) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.6),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white24, width: 0.8),
                                  ),
                                  child: Text(
                                    movie.year!,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 10),

                          // Title
                          Text(
                            movie.title,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.white : AppTheme.lightTextPrimary,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 6),

                          // Languages / Categories
                          Text(
                            movie.languages.isNotEmpty
                                ? movie.languages.join(' • ')
                                : (movie.categories.isNotEmpty
                                    ? movie.categories.map((c) => c.name).join(' • ')
                                    : 'Movie'),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: isDark ? Colors.white70 : AppTheme.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Action Buttons
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Download Now
                              ElevatedButton.icon(
                                onPressed: () => DownloadSheet.show(context, movie),
                                icon: const Icon(Icons.download_rounded, size: 16),
                                label: const Text('Download', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primaryRed,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 4,
                                ),
                              ),
                              const SizedBox(width: 12),

                              // Info
                              OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => MovieDetailScreen(movie: movie)),
                                  );
                                },
                                icon: Icon(
                                  Icons.info_outline_rounded,
                                  size: 16,
                                  color: isDark ? Colors.white : AppTheme.lightTextPrimary,
                                ),
                                label: Text(
                                  'Details',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                    color: isDark ? Colors.white : AppTheme.lightTextPrimary,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                                  side: BorderSide(
                                    color: isDark ? Colors.white24 : Colors.black12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),

        // Indicator Dots
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            featured.length,
            (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentPage == i ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _currentPage == i ? AppTheme.primaryRed : Colors.grey.withOpacity(0.35),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
