import 'dart:async';
import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/movie_card.dart';
import '../widgets/shimmer_loading.dart';
import '../widgets/date_filter_dialog.dart';

class CategoryDetailScreen extends StatefulWidget {
  final MovieCategory category;

  const CategoryDetailScreen({super.key, required this.category});

  @override
  State<CategoryDetailScreen> createState() => _CategoryDetailScreenState();
}

class _CategoryDetailScreenState extends State<CategoryDetailScreen> {
  final List<Movie> _movies = [];
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  Timer? _debounce;

  int _currentPage = 1;
  int _totalPages = 1;
  bool _isLoading = true;
  bool _isPageLoading = false;
  String _sortOrder = 'newest'; // 'newest' | 'oldest'
  DateTimeRange? _selectedDateRange;

  final ScrollController _scrollController = ScrollController();

  String _formatDate(DateTime dt) {
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }

  @override
  void initState() {
    super.initState();
    _loadMovies();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _sortMoviesList(List<Movie> list) {
    list.sort((a, b) {
      final timeA = a.uploadDateTime?.millisecondsSinceEpoch ?? 0;
      final timeB = b.uploadDateTime?.millisecondsSinceEpoch ?? 0;
      if (timeA != timeB) {
        return _sortOrder == 'newest'
            ? timeB.compareTo(timeA) // Newest first
            : timeA.compareTo(timeB); // Oldest first
      }
      return _sortOrder == 'newest'
          ? b.id.compareTo(a.id)
          : a.id.compareTo(b.id);
    });
  }

  Future<void> _loadMovies({int page = 1}) async {
    if (ApiService.isAdultCategory(widget.category.name, widget.category.slug)) {
      if (mounted) {
        setState(() {
          _movies.clear();
          _isLoading = false;
        });
      }
      return;
    }

    setState(() {
      if (page == 1) {
        _isLoading = true;
      } else {
        _isPageLoading = true;
      }
    });

    final categoryParam = widget.category.slug.isNotEmpty ? widget.category.slug : widget.category.id.toString();

    try {
      final res = await ApiService.fetchMovies(
        category: categoryParam,
        page: page,
        perPage: 50,
        sort: _sortOrder,
        startDate: _selectedDateRange?.start,
        endDate: _selectedDateRange?.end,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
      );

      if (mounted) {
        setState(() {
          _movies.clear();
          _movies.addAll(res.movies);
          _sortMoviesList(_movies);
          _currentPage = res.currentPage;
          _totalPages = res.totalPages;
          _isLoading = false;
          _isPageLoading = false;
        });

        // User requested: Once loaded, scroll to top of movies
        if (page > 1) {
          _scrollToTop();
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isPageLoading = false;
        });
      }
    }
  }

  void _scrollToTop() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  Future<void> _goToPage(int page) async {
    if (page < 1 || page > _totalPages || page == _currentPage || _isPageLoading) return;

    await _loadMovies(page: page);
    _scrollToTop();
  }

  Future<void> _changeSortOrder(String newSort) async {
    if (_sortOrder == newSort || _isPageLoading) return;

    setState(() {
      _sortOrder = newSort;
      _currentPage = 1;
    });

    await _loadMovies(page: 1);
    _scrollToTop();
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
      });

      await _loadMovies(page: 1);
      _scrollToTop();
    }
  }

  void _clearDateFilter() async {
    setState(() {
      _selectedDateRange = null;
      _currentPage = 1;
    });

    await _loadMovies(page: 1);
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    setState(() {
      _searchQuery = query.trim();
    });

    if (query.trim().length >= 2) {
      _debounce = Timer(const Duration(milliseconds: 500), () async {
        final categoryParam = widget.category.slug.isNotEmpty ? widget.category.slug : widget.category.id.toString();
        final res = await ApiService.fetchMovies(
          category: categoryParam,
          search: query.trim(),
          page: 1,
          perPage: 50,
          sort: _sortOrder,
          startDate: _selectedDateRange?.start,
          endDate: _selectedDateRange?.end,
        );
        if (mounted && _searchQuery == query.trim()) {
          setState(() {
            final existingIds = _movies.map((m) => m.id).toSet();
            for (final m in res.movies) {
              if (!existingIds.contains(m.id)) {
                _movies.add(m);
              }
            }
            _sortMoviesList(_movies);
          });
        }
      });
    }
  }

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
            'Page $_currentPage of $_totalPages  •  50 movies per page',
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

    final filteredMovies = _searchQuery.isEmpty
        ? _movies
        : _movies.where((m) {
            final q = _searchQuery.toLowerCase();
            return m.title.toLowerCase().contains(q) ||
                m.rawTitle.toLowerCase().contains(q) ||
                (m.year != null && m.year!.contains(q));
          }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          widget.category.name,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
        ),
      ),
      body: Column(
        children: [
          // Search Box inside Category Detail Screen
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? AppTheme.darkCard : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? Colors.white.withOpacity(0.08) : Colors.grey.shade300,
                ),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                ),
                decoration: InputDecoration(
                  hintText: 'Search in ${widget.category.name}...',
                  hintStyle: TextStyle(
                    fontSize: 13,
                    color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                  ),
                  prefixIcon: Icon(
                    Icons.search_rounded,
                    size: 20,
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                  ),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: Icon(
                            Icons.clear_rounded,
                            size: 18,
                            color: isDark ? Colors.grey[400] : Colors.grey[600],
                          ),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                ),
              ),
            ),
          ),

          // Filter Controls: Newest / Oldest / Calendar Date Range Picker
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Movies',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                  ),
                ),
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
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 3.0),
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

          // Main Content
          Expanded(
            child: _isLoading
                ? GridView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.52,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 14,
                    ),
                    itemCount: 8,
                    itemBuilder: (_, __) => const ShimmerMovieCard(),
                  )
                : filteredMovies.isEmpty
                    ? RefreshIndicator(
                        onRefresh: () => _loadMovies(page: _currentPage),
                        color: AppTheme.primaryRed,
                        child: ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: [
                            SizedBox(height: MediaQuery.of(context).size.height * 0.2),
                            Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    _selectedDateRange != null
                                        ? Icons.event_busy_rounded
                                        : Icons.movie_filter_outlined,
                                    size: 48,
                                    color: Colors.grey[600],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    _selectedDateRange != null
                                        ? 'No movies found between ${_formatDate(_selectedDateRange!.start)} and ${_formatDate(_selectedDateRange!.end)}'
                                        : _searchQuery.isNotEmpty
                                            ? 'No movies found matching "$_searchQuery"'
                                            : 'No movies found in this genre.',
                                    style: TextStyle(
                                      color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                                    ),
                                    textAlign: TextAlign.center,
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
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => _loadMovies(page: _currentPage),
                        color: AppTheme.primaryRed,
                        child: SingleChildScrollView(
                          controller: _scrollController,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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
                                    : GridView.builder(
                                        shrinkWrap: true,
                                        physics: const NeverScrollableScrollPhysics(),
                                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                          crossAxisCount: 2,
                                          childAspectRatio: 0.52,
                                          crossAxisSpacing: 12,
                                          mainAxisSpacing: 14,
                                        ),
                                        itemCount: filteredMovies.length,
                                        itemBuilder: (context, index) {
                                          return MovieCard(movie: filteredMovies[index]);
                                        },
                                      ),
                              ),

                              // Numbered Pagination Bar (50 movies per page)
                              if (_searchQuery.isEmpty)
                                _buildPaginationBar(isDark),

                              const SizedBox(height: 24),
                            ],
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
