import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.grey[850]! : Colors.grey[300]!,
      highlightColor: isDark ? Colors.grey[750]! : Colors.grey[100]!,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: isDark ? Colors.grey[850] : Colors.grey[300],
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

class ShimmerMovieCard extends StatelessWidget {
  const ShimmerMovieCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        AspectRatio(
          aspectRatio: 2 / 3,
          child: ShimmerBox(width: double.infinity, height: double.infinity, borderRadius: 12),
        ),
        SizedBox(height: 8),
        ShimmerBox(width: double.infinity, height: 12, borderRadius: 4),
        SizedBox(height: 4),
        ShimmerBox(width: 60, height: 10, borderRadius: 4),
      ],
    );
  }
}

class ShimmerCategoryCard extends StatelessWidget {
  const ShimmerCategoryCard({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131826) : Colors.grey[200],
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              ShimmerBox(width: 32, height: 32, borderRadius: 10),
              ShimmerBox(width: 40, height: 16, borderRadius: 10),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ShimmerBox(width: 80, height: 14, borderRadius: 4),
              SizedBox(height: 4),
              ShimmerBox(width: 50, height: 10, borderRadius: 4),
            ],
          ),
        ],
      ),
    );
  }
}

class ShimmerHeroCarousel extends StatelessWidget {
  const ShimmerHeroCarousel({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16.0),
      child: AspectRatio(
        aspectRatio: 16 / 9.5,
        child: ShimmerBox(
          width: double.infinity,
          height: double.infinity,
          borderRadius: 20,
        ),
      ),
    );
  }
}

class ShimmerHorizontalSection extends StatelessWidget {
  const ShimmerHorizontalSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.0),
          child: ShimmerBox(width: 140, height: 16, borderRadius: 4),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 275,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 4,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, __) => const SizedBox(
              width: 140,
              child: ShimmerMovieCard(),
            ),
          ),
        ),
      ],
    );
  }
}
