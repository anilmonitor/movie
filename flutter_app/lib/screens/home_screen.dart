import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/horizontal_movie_list.dart';
import '../widgets/movie_card.dart';
import '../widgets/shimmer_loading.dart';
import '../widgets/date_filter_dialog.dart';
import 'search_screen.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback? onToggleTheme;

  const HomeScreen({super.key, this.onToggleTheme});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<Movie> _allMovies = [];
  List<Movie> _heroMovies = [];

  bool _isLoading = true;
  bool _isPageLoading = false;
  int _currentPage = 1;
  int _totalPages = 1;
  String _sortOrder = 'newest'; // 'newest' | 'oldest'
  DateTimeRange? _selectedDateRange;

  final ScrollController _scrollController = ScrollController();

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);

    try {
      final res = await ApiService.fetchMovies(
        page: 1,
        perPage: 60,
        sort: _sortOrder,
        startDate: _selectedDateRange?.start,
        endDate: _selectedDateRange?.end,
      );

      if (mounted) {
        setState(() {
          _allMovies = res.movies;
          _currentPage = res.currentPage;
          _totalPages = res.totalPages;
          if (_heroMovies.isEmpty && res.movies.isNotEmpty) {
            _heroMovies = res.movies.take(15).toList();
          }
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  final GlobalKey _allReleasesKey = GlobalKey();

  void _scrollToAllReleases() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentCtx = _allReleasesKey.currentContext;
      if (currentCtx != null) {
        Scrollable.ensureVisible(
          currentCtx,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
          alignment: 0.0,
        );
      } else if (_scrollController.hasClients) {
        _scrollController.animateTo(
          480,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  Future<void> _goToPage(int page) async {
    if (page < 1 || page > _totalPages || page == _currentPage || _isPageLoading) return;

    setState(() {
      _currentPage = page;
      _isPageLoading = true;
    });

    try {
      final res = await ApiService.fetchMovies(
        page: page,
        perPage: 60,
        sort: _sortOrder,
        startDate: _selectedDateRange?.start,
        endDate: _selectedDateRange?.end,
      );

      if (mounted) {
        setState(() {
          _allMovies = res.movies;
          _currentPage = res.currentPage;
          _totalPages = res.totalPages;
          _isPageLoading = false;
        });

        // User requested: Jab load ho jaye to All Releases ke paas bhej dena
        _scrollToAllReleases();
      }
    } catch (_) {
      if (mounted) setState(() => _isPageLoading = false);
    }
  }

  Future<void> _changeSortOrder(String newSort) async {
    if (_sortOrder == newSort || _isPageLoading) return;

    setState(() {
      _sortOrder = newSort;
      _currentPage = 1;
      _isPageLoading = true;
    });

    _scrollController.animateTo(
      480,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOut,
    );

    try {
      final res = await ApiService.fetchMovies(
        page: 1,
        perPage: 60,
        sort: _sortOrder,
        startDate: _selectedDateRange?.start,
        endDate: _selectedDateRange?.end,
      );

      if (mounted) {
        setState(() {
          _allMovies = res.movies;
          _currentPage = res.currentPage;
          _totalPages = res.totalPages;
          _isPageLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isPageLoading = false);
    }
  }

  Future<void> _pickDateRange(BuildContext context) async {
    final result = await DateFilterDialog.show(
      context,
      initialStartDate: _selectedDateRange?.start,
      initialEndDate: _selectedDateRange?.end,
    );

    if (result == 'RESET') {
      _clearDateFilter();
      return;
    }

    if (result is DateTimeRange) {
      setState(() {
        _selectedDateRange = result;
        _currentPage = 1;
        _isPageLoading = true;
      });

      try {
        final res = await ApiService.fetchMovies(
          page: 1,
          perPage: 60,
          sort: _sortOrder,
          startDate: _selectedDateRange?.start,
          endDate: _selectedDateRange?.end,
        );

        if (mounted) {
          setState(() {
            _allMovies = res.movies;
            _currentPage = res.currentPage;
            _totalPages = res.totalPages;
            _isPageLoading = false;
          });
          _scrollToAllReleases();
        }
      } catch (_) {
        if (mounted) setState(() => _isPageLoading = false);
      }
    }
  }

  void _clearDateFilter() async {
    setState(() {
      _selectedDateRange = null;
      _currentPage = 1;
      _isPageLoading = true;
    });

    try {
      final res = await ApiService.fetchMovies(
        page: 1,
        perPage: 60,
        sort: _sortOrder,
      );

      if (mounted) {
        setState(() {
          _allMovies = res.movies;
          _currentPage = res.currentPage;
          _totalPages = res.totalPages;
          _isPageLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isPageLoading = false);
    }
  }

  // Small, subtle sort chip with minimal styling
  Widget _buildSortChip({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return InkWell(
      onTap: _isPageLoading ? null : onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? Colors.white.withOpacity(0.14) : Colors.black.withOpacity(0.08))
              : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected
                ? (isDark ? Colors.white : Colors.black)
                : (isDark ? Colors.grey[400] : Colors.grey[600]),
          ),
        ),
      ),
    );
  }

  Widget _buildPaginationBar(bool isDark) {
    if (_totalPages <= 1) return const SizedBox.shrink();

    final Set<int> pagesToShow = {};
    pagesToShow.add(1);
    if (_totalPages > 1) pagesToShow.add(_totalPages);

    for (int i = _currentPage - 2; i <= _currentPage + 2; i++) {
      if (i >= 1 && i <= _totalPages) {
        pagesToShow.add(i);
      }
    }
    final sortedPages = pagesToShow.toList()..sort();

    final List<Widget> items = [];

    // Previous Button
    items.add(
      InkWell(
        onTap: _currentPage > 1 && !_isPageLoading ? () => _goToPage(_currentPage - 1) : null,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: _currentPage > 1
                ? (isDark ? AppTheme.darkCard : Colors.white)
                : (isDark ? Colors.white.withOpacity(0.04) : Colors.grey.shade200),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: _currentPage > 1
                  ? (isDark ? Colors.white.withOpacity(0.12) : Colors.grey.shade300)
                  : Colors.transparent,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.chevron_left_rounded,
                size: 16,
                color: _currentPage > 1
                    ? (isDark ? Colors.white : Colors.black87)
                    : Colors.grey.shade500,
              ),
              const SizedBox(width: 2),
              Text(
                'Prev',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: _currentPage > 1
                      ? (isDark ? Colors.white : Colors.black87)
                      : Colors.grey.shade500,
                ),
              ),
            ],
          ),
        ),
      ),
    );

    items.add(const SizedBox(width: 5));

    for (int i = 0; i < sortedPages.length; i++) {
      final p = sortedPages[i];
      if (i > 0 && p - sortedPages[i - 1] > 1) {
        items.add(
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              '...',
              style: TextStyle(
                color: isDark ? Colors.grey[500] : Colors.grey[600],
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        );
      }

      final isSelected = p == _currentPage;
      items.add(
        InkWell(
          onTap: !isSelected && !_isPageLoading ? () => _goToPage(p) : null,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            width: 34,
            height: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primaryRed
                  : (isDark ? AppTheme.darkCard : Colors.white),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isSelected
                    ? AppTheme.primaryRed
                    : (isDark ? Colors.white.withOpacity(0.12) : Colors.grey.shade300),
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: AppTheme.primaryRed.withOpacity(0.35),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Text(
              '$p',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                color: isSelected
                    ? Colors.white
                    : (isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary),
              ),
            ),
          ),
        ),
      );
      items.add(const SizedBox(width: 4));
    }

    // Next Button
    items.add(
      InkWell(
        onTap: _currentPage < _totalPages && !_isPageLoading ? () => _goToPage(_currentPage + 1) : null,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: _currentPage < _totalPages
                ? (isDark ? AppTheme.darkCard : Colors.white)
                : (isDark ? Colors.white.withOpacity(0.04) : Colors.grey.shade200),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: _currentPage < _totalPages
                  ? (isDark ? Colors.white.withOpacity(0.12) : Colors.grey.shade300)
                  : Colors.transparent,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Next',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: _currentPage < _totalPages
                      ? (isDark ? Colors.white : Colors.black87)
                      : Colors.grey.shade500,
                ),
              ),
              const SizedBox(width: 2),
              Icon(
                Icons.chevron_right_rounded,
                size: 16,
                color: _currentPage < _totalPages
                    ? (isDark ? Colors.white : Colors.black87)
                    : Colors.grey.shade500,
              ),
            ],
          ),
        ),
      ),
    );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        children: [
          Text(
            'Page $_currentPage of $_totalPages  •  60 movies per page',
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: items,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
                text: 'MOVIE',
                style: TextStyle(
                  color: isDark ? Colors.white : AppTheme.lightTextPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
                children: const [
                  TextSpan(
                    text: '4U',
                    style: TextStyle(
                      color: AppTheme.primaryRed,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          // Join Telegram Button
          Center(
            child: InkWell(
              onTap: () async {
                final uri = Uri.parse('https://t.me/+E2B_D_7AQIkyMjI1');
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              },
              borderRadius: BorderRadius.circular(18),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(
                  color: const Color(0xFF229ED9).withOpacity(0.16),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: const Color(0xFF229ED9).withOpacity(0.45),
                    width: 1,
                  ),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.send_rounded,
                      size: 13,
                      color: Color(0xFF229ED9),
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Join Telegram',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF229ED9),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 2),
          IconButton(
            icon: const Icon(Icons.search_rounded),
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
              padding: const EdgeInsets.only(top: 12, bottom: 40),
              children: [
                const ShimmerHeroCarousel(),
                const SizedBox(height: 24),
                const ShimmerHorizontalSection(),
                const SizedBox(height: 24),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16.0),
                  child: ShimmerBox(width: 130, height: 16, borderRadius: 4),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.52,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 14,
                    ),
                    itemCount: 6,
                    itemBuilder: (_, __) => const ShimmerMovieCard(),
                  ),
                ),
              ],
            )
          : RefreshIndicator(
              onRefresh: () => _goToPage(_currentPage),
              color: AppTheme.primaryRed,
              child: SingleChildScrollView(
                controller: _scrollController,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Top Hero Banner
                    HeroCarousel(movies: _heroMovies.isNotEmpty ? _heroMovies : _allMovies),
                    const SizedBox(height: 24),

                    // Latest Releases Horizontal Row
                    if (_heroMovies.isNotEmpty)
                      HorizontalMovieList(
                        title: 'Latest Releases',
                        movies: _heroMovies,
                        onSeeAll: _scrollToAllReleases,
                      ),
                    const SizedBox(height: 24),

                    // All Releases Section Header with Filter Buttons
                    Container(
                      key: _allReleasesKey,
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

                          // Compact Filter Controls: Newest / Oldest / Calendar
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _buildSortChip(
                                label: 'Newest',
                                isSelected: _sortOrder == 'newest',
                                onTap: () => _changeSortOrder('newest'),
                                isDark: isDark,
                              ),
                              const SizedBox(width: 2),
                              _buildSortChip(
                                label: 'Oldest',
                                isSelected: _sortOrder == 'oldest',
                                onTap: () => _changeSortOrder('oldest'),
                                isDark: isDark,
                              ),
                              const SizedBox(width: 4),

                              // Calendar Date Filter Button
                              InkWell(
                                onTap: _isPageLoading ? null : () => _pickDateRange(context),
                                borderRadius: BorderRadius.circular(6),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3.5),
                                  decoration: BoxDecoration(
                                    color: _selectedDateRange != null
                                        ? AppTheme.primaryRed.withOpacity(0.15)
                                        : (isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.04)),
                                    borderRadius: BorderRadius.circular(6),
                                    border: _selectedDateRange != null
                                        ? Border.all(color: AppTheme.primaryRed, width: 1)
                                        : null,
                                  ),
                                  child: Icon(
                                    Icons.calendar_month_rounded,
                                    size: 15,
                                    color: _selectedDateRange != null
                                        ? AppTheme.primaryRed
                                        : (isDark ? Colors.grey[400] : Colors.grey[700]),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Active Date Filter Badge (if selected)
                    if (_selectedDateRange != null) ...[
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryRed.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: AppTheme.primaryRed.withOpacity(0.3),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.filter_alt_rounded,
                                    size: 11,
                                    color: AppTheme.primaryRed,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${_formatDate(_selectedDateRange!.start)} – ${_formatDate(_selectedDateRange!.end)}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: AppTheme.primaryRed,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  InkWell(
                                    onTap: _isPageLoading ? null : _clearDateFilter,
                                    child: const Icon(
                                      Icons.close_rounded,
                                      size: 13,
                                      color: AppTheme.primaryRed,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 12),

                    // Grid of Movies (60 items per page)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: _isPageLoading
                          ? GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.52,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 14,
                              ),
                              itemCount: 8,
                              itemBuilder: (_, __) => const ShimmerMovieCard(),
                            )
                          : _allMovies.isEmpty
                              ? Container(
                                  padding: const EdgeInsets.symmetric(vertical: 40),
                                  alignment: Alignment.center,
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.event_busy_rounded,
                                        size: 42,
                                        color: isDark ? Colors.grey[600] : Colors.grey[400],
                                      ),
                                      const SizedBox(height: 10),
                                      Text(
                                        _selectedDateRange != null
                                            ? 'No movies found between ${_formatDate(_selectedDateRange!.start)} and ${_formatDate(_selectedDateRange!.end)}'
                                            : 'No movies found.',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                                        ),
                                      ),
                                      if (_selectedDateRange != null) ...[
                                        const SizedBox(height: 12),
                                        TextButton.icon(
                                          onPressed: _clearDateFilter,
                                          icon: const Icon(Icons.refresh_rounded, size: 16),
                                          label: const Text('Reset Date Filter'),
                                          style: TextButton.styleFrom(
                                            foregroundColor: AppTheme.primaryRed,
                                          ),
                                        ),
                                      ],
                                    ],
                                  ),
                                )
                              : GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    childAspectRatio: 0.52,
                                    crossAxisSpacing: 12,
                                    mainAxisSpacing: 14,
                                  ),
                                  itemCount: _allMovies.length,
                                  itemBuilder: (context, index) {
                                    return MovieCard(movie: _allMovies[index]);
                                  },
                                ),
                    ),

                    // Numbered Pagination Bar (1, 2, 3, 4... with Prev/Next)
                    _buildPaginationBar(isDark),

                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
    );
  }
}
