import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/movie_card.dart';
import '../widgets/shimmer_loading.dart';

class CategoryDetailScreen extends StatefulWidget {
  final MovieCategory category;

  const CategoryDetailScreen({super.key, required this.category});

  @override
  State<CategoryDetailScreen> createState() => _CategoryDetailScreenState();
}

class _CategoryDetailScreenState extends State<CategoryDetailScreen> {
  final List<Movie> _movies = [];
  int _currentPage = 1;
  int _totalPages = 1;
  bool _isLoading = true;
  bool _isLoadingMore = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadMovies();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 &&
        !_isLoadingMore &&
        _currentPage < _totalPages) {
      _loadMore();
    }
  }

  Future<void> _loadMovies() async {
    if (ApiService.isAdultCategory(widget.category.name, widget.category.slug)) {
      if (mounted) {
        setState(() {
          _movies.clear();
          _isLoading = false;
        });
      }
      return;
    }
    setState(() => _isLoading = true);
    final res = await ApiService.fetchMovies(
      category: widget.category.slug.isNotEmpty ? widget.category.slug : widget.category.id.toString(),
      page: 1,
    );
    if (mounted) {
      setState(() {
        _movies.clear();
        _movies.addAll(res.movies);
        _currentPage = res.currentPage;
        _totalPages = res.totalPages;
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    setState(() => _isLoadingMore = true);
    final res = await ApiService.fetchMovies(
      category: widget.category.id.toString(),
      page: _currentPage + 1,
    );
    if (mounted) {
      setState(() {
        _movies.addAll(res.movies);
        _currentPage = res.currentPage;
        _totalPages = res.totalPages;
        _isLoadingMore = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          '${widget.category.name} Movies',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
        ),
      ),
      body: _isLoading
          ? GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.52,
                crossAxisSpacing: 12,
                mainAxisSpacing: 14,
              ),
              itemCount: 9,
              itemBuilder: (_, __) => const ShimmerMovieCard(),
            )
          : _movies.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.movie_filter_outlined, size: 48, color: Colors.grey[600]),
                      const SizedBox(height: 12),
                      Text(
                        'No movies found in this genre.',
                        style: TextStyle(color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadMovies,
                  color: AppTheme.primaryRed,
                  child: GridView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.52,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 14,
                    ),
                    itemCount: _movies.length + (_isLoadingMore ? 3 : 0),
                    itemBuilder: (context, index) {
                      if (index >= _movies.length) {
                        return const ShimmerMovieCard();
                      }
                      return MovieCard(movie: _movies[index]);
                    },
                  ),
                ),
    );
  }
}
