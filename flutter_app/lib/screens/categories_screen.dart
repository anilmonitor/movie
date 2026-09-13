import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/telegram_button.dart';
import 'category_detail_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  // Pre-fill with guaranteed default categories so screen is NEVER blank
  List<MovieCategory> _categories = ApiService.defaultCategories;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    final list = await ApiService.fetchCategories();
    if (mounted) {
      setState(() {
        if (list.isNotEmpty) {
          _categories = list;
        }
      });
    }
  }

  // Curated gradient pairs for categories
  final List<List<Color>> _gradients = [
    [const Color(0xFFE50914), const Color(0xFF991B1B)],
    [const Color(0xFF2563EB), const Color(0xFF1E40AF)],
    [const Color(0xFF7C3AED), const Color(0xFF5B21B6)],
    [const Color(0xFFD97706), const Color(0xFFB45309)],
    [const Color(0xFF059669), const Color(0xFF047857)],
    [const Color(0xFFDB2777), const Color(0xFF9D174D)],
    [const Color(0xFF0891B2), const Color(0xFF0E7490)],
    [const Color(0xFF4F46E5), const Color(0xFF3730A3)],
  ];

  // Guarantee 18+ is placed at the bottom
  List<MovieCategory> get _sortedCategories {
    final list = List<MovieCategory>.from(_categories);
    final adult = list.where((c) => c.slug == '18' || c.name.contains('18+')).toList();
    list.removeWhere((c) => c.slug == '18' || c.name.contains('18+'));
    list.addAll(adult);
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final displayCategories = _sortedCategories;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Categories', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20)),
        actions: const [
          TelegramButton(),
          SizedBox(width: 10),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadCategories,
        color: AppTheme.primaryRed,
        child: Column(
          children: [
            // Long official Telegram banner at top
            const TelegramBannerCard(
              margin: EdgeInsets.fromLTRB(16, 8, 16, 6),
            ),
            Expanded(
              child: GridView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 20),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 1.4,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: displayCategories.length,
                itemBuilder: (context, index) {
                  final cat = displayCategories[index];
                  final grad = _gradients[index % _gradients.length];

                  return GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => CategoryDetailScreen(category: cat),
                        ),
                      );
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(18),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: isDark
                              ? [grad[0].withOpacity(0.85), grad[1].withOpacity(0.65)]
                              : [grad[0].withOpacity(0.9), grad[1]],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: grad[0].withOpacity(0.25),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Align(
                            alignment: Alignment.topRight,
                            child: Icon(Icons.movie_creation_outlined, color: Colors.white70, size: 22),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                cat.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.white,
                                ),
                              ),
                              if (cat.count != null)
                                Text(
                                  '${cat.count} Titles',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: Colors.white70,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
