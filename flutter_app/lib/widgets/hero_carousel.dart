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
                              Colors.black.withOpacity(0.15),
                              Colors.transparent,
                              Colors.black.withOpacity(0.65),
                              Colors.black.withOpacity(0.92),
                            ],
                            stops: const [0.0, 0.35, 0.7, 1.0],
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

                          // Title - Always bright white with shadow for maximum readability
                          Text(
                            movie.title,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: -0.3,
                              shadows: [
                                Shadow(
                                  color: Colors.black,
                                  blurRadius: 12,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 6),

                          // Languages / Categories - Always bright white with shadow
                          Text(
                            movie.languages.isNotEmpty
                                ? movie.languages.join(' • ')
                                : (movie.categories.isNotEmpty
                                    ? movie.categories.map((c) => c.name).join(' • ')
                                    : 'Movie'),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: Colors.white.withOpacity(0.88),
                              shadows: const [
                                Shadow(
                                  color: Colors.black87,
                                  blurRadius: 8,
                                  offset: Offset(0, 1),
                                ),
                              ],
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

                              // Info / Details Button
                              OutlinedButton.icon(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => MovieDetailScreen(movie: movie)),
                                  );
                                },
                                icon: const Icon(
                                  Icons.info_outline_rounded,
                                  size: 16,
                                  color: Colors.white,
                                ),
                                label: const Text(
                                  'Details',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 13,
                                    color: Colors.white,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  backgroundColor: Colors.white.withOpacity(0.14),
                                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                                  side: BorderSide(
                                    color: Colors.white.withOpacity(0.4),
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
