import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/movie.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/watchlist_service.dart';
import '../widgets/download_sheet.dart';
import '../widgets/horizontal_movie_list.dart';
import '../widgets/shimmer_loading.dart';
import '../widgets/app_poster_image.dart';
import '../widgets/screenshot_gallery_dialog.dart';
import '../widgets/telegram_button.dart';

class MovieDetailScreen extends StatefulWidget {
  final Movie movie;

  const MovieDetailScreen({super.key, required this.movie});

  @override
  State<MovieDetailScreen> createState() => _MovieDetailScreenState();
}

class _MovieDetailScreenState extends State<MovieDetailScreen> {
  late Movie _movie;
  bool _isSaved = false;
  bool _isExpanded = false;
  List<Movie> _relatedMovies = [];
  bool _isLoadingRelated = true;

  @override
  void initState() {
    super.initState();
    _movie = widget.movie;
    _checkSaved();
    _loadFullDetails();
    _loadRelated();
  }

  Future<void> _checkSaved() async {
    final saved = await WatchlistService.isInWatchlist(_movie.id);
    if (mounted) setState(() => _isSaved = saved);
  }

  void _toggleWatchlist() async {
    final added = await WatchlistService.toggleWatchlist(_movie);
    if (mounted) {
      setState(() => _isSaved = added);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(added ? 'Added to Watchlist' : 'Removed from Watchlist'),
          duration: const Duration(seconds: 1),
        ),
      );
    }
  }

  Future<void> _loadFullDetails() async {
    final full = await ApiService.fetchMovieBySlug(_movie.slug);
    if (full != null && mounted) {
      setState(() {
        _movie = full;
      });
    }
  }

  Future<void> _loadRelated() async {
    final primaryCat = _movie.categories.isNotEmpty ? _movie.categories.first.id.toString() : null;
    final res = await ApiService.fetchMovies(category: primaryCat, perPage: 8);
    if (mounted) {
      setState(() {
        _relatedMovies = res.movies.where((m) => m.id != _movie.id).take(6).toList();
        _isLoadingRelated = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Parallax Hero App Bar
          SliverAppBar(
            expandedHeight: 380,
            pinned: true,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: CircleAvatar(
                backgroundColor: Colors.black.withOpacity(0.55),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: CircleAvatar(
                  backgroundColor: Colors.black.withOpacity(0.55),
                  child: IconButton(
                    icon: Icon(
                      _isSaved ? Icons.bookmark : Icons.bookmark_border,
                      color: _isSaved ? AppTheme.primaryRed : Colors.white,
                      size: 20,
                    ),
                    onPressed: _toggleWatchlist,
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  AppPosterImage(
                    imageUrl: _movie.poster,
                    fit: BoxFit.cover,
                  ),
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withOpacity(0.5),
                          Colors.transparent,
                          isDark ? AppTheme.darkBackground : AppTheme.lightBackground,
                        ],
                        stops: const [0.0, 0.45, 1.0],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content Body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges Wrap (Never overflows on narrow screens)
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      if (_movie.rating != null && _movie.rating!.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.ratingGold,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star, color: Colors.black, size: 12),
                              const SizedBox(width: 3),
                              Text(
                                '${_movie.rating!} / 10',
                                style: const TextStyle(
                                  color: Colors.black,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (_movie.year != null && _movie.year!.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white12 : Colors.black.withOpacity(0.06),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _movie.year!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                            ),
                          ),
                        ),
                      for (final q in _movie.qualities.take(2))
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryRed.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.primaryRed.withOpacity(0.3)),
                          ),
                          child: Text(
                            q,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.primaryRed,
                            ),
                          ),
                        ),
                      if (_movie.timeAgo.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.amber.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.ratingGold.withOpacity(0.4)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.access_time_rounded, size: 11, color: AppTheme.ratingGold),
                              const SizedBox(width: 4),
                              Text(
                                _movie.timeAgo,
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.ratingGold,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Title
                  Text(
                    _movie.title,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Action Buttons Row (Download and Telegram guaranteed on one line)
                  SizedBox(
                    height: 48,
                    child: Row(
                      children: [
                        // Download Button
                        Expanded(
                          flex: 3,
                          child: ElevatedButton(
                            onPressed: () => DownloadSheet.show(context, _movie),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryRed,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 2,
                            ),
                            child: const FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.download_rounded, size: 18),
                                  SizedBox(width: 6),
                                  Text(
                                    'Download',
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Telegram Button
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            onPressed: openTelegram,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF229ED9),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              elevation: 2,
                            ),
                            child: const FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  TelegramCircleLogo(size: 20),
                                  SizedBox(width: 6),
                                  Text(
                                    'Telegram',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Specs Grid
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? AppTheme.darkCard : AppTheme.lightSurface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
                      ),
                    ),
                    child: Column(
                      children: [
                        _buildSpecRow(
                          context,
                          icon: Icons.language,
                          label: 'Languages',
                          value: _movie.languages.isNotEmpty ? _movie.languages.join(', ') : 'Hindi',
                        ),
                        const Divider(height: 16, thickness: 0.6),
                        _buildSpecRow(
                          context,
                          icon: Icons.high_quality,
                          label: 'Qualities',
                          value: _movie.qualities.isNotEmpty ? _movie.qualities.join(' • ') : '480p, 720p, 1080p',
                        ),
                        const Divider(height: 16, thickness: 0.6),
                        _buildSpecRow(
                          context,
                          icon: Icons.sd_storage_rounded,
                          label: 'File Size',
                          value: _movie.size ?? '350MB - 2GB',
                        ),
                        if (_movie.formattedUploadDate.isNotEmpty) ...[
                          const Divider(height: 16, thickness: 0.6),
                          _buildSpecRow(
                            context,
                            icon: Icons.access_time_filled_rounded,
                            label: 'Uploaded on',
                            value: _movie.formattedUploadDate,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Storyline Section
                  if (_movie.storyline != null && _movie.storyline!.isNotEmpty) ...[
                    Text(
                      'Storyline',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _movie.storyline!,
                      maxLines: _isExpanded ? 100 : 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.5,
                        color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _isExpanded = !_isExpanded),
                      child: Padding(
                        padding: const EdgeInsets.only(top: 4.0),
                        child: Text(
                          _isExpanded ? 'Show less' : 'Read more...',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primaryRed,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Screenshots
                  if (_movie.screenshots.isNotEmpty) ...[
                    Text(
                      'Screenshots',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 120,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _movie.screenshots.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (context, index) {
                          return GestureDetector(
                            onTap: () {
                              ScreenshotGalleryDialog.show(
                                context,
                                images: _movie.screenshots,
                                initialIndex: index,
                              );
                            },
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: AspectRatio(
                                aspectRatio: 16 / 9,
                                child: Stack(
                                  children: [
                                    CachedNetworkImage(
                                      imageUrl: _movie.screenshots[index],
                                      fit: BoxFit.cover,
                                      width: double.infinity,
                                      height: double.infinity,
                                      placeholder: (_, __) => const ShimmerBox(
                                        width: double.infinity,
                                        height: double.infinity,
                                        borderRadius: 10,
                                      ),
                                      errorWidget: (_, __, ___) => Container(color: Colors.grey[900]),
                                    ),
                                    Positioned(
                                      bottom: 6,
                                      right: 6,
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withOpacity(0.6),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(
                                          Icons.fullscreen_rounded,
                                          size: 14,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Related Movies
                  HorizontalMovieList(
                    title: 'More Like This',
                    movies: _relatedMovies,
                    isLoading: _isLoadingRelated,
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecRow(BuildContext context, {required IconData icon, required String label, required String value}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.primaryRed),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
