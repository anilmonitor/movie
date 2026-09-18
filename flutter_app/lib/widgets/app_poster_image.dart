import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'shimmer_loading.dart';

class AppPosterImage extends StatelessWidget {
  final String imageUrl;
  final BoxFit fit;
  final Alignment alignment;
  final Widget? placeholder;
  final Widget? errorWidget;

  const AppPosterImage({
    super.key,
    required this.imageUrl,
    this.fit = BoxFit.cover,
    this.alignment = Alignment.center,
    this.placeholder,
    this.errorWidget,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final defaultPlaceholder = placeholder ??
        const ShimmerBox(
          width: double.infinity,
          height: double.infinity,
          borderRadius: 0,
        );

    final defaultError = errorWidget ??
        Container(
          color: isDark ? Colors.grey[900] : Colors.grey[200],
          child: Center(
            child: Icon(
              Icons.movie_outlined,
              color: isDark ? Colors.grey[700] : Colors.grey[400],
              size: 32,
            ),
          ),
        );

    if (imageUrl.isEmpty) {
      return defaultError;
    }

    // Handle Data URI / Base64 images directly
    if (imageUrl.startsWith('data:image')) {
      try {
        final commaIndex = imageUrl.indexOf(',');
        final base64Str = commaIndex != -1 ? imageUrl.substring(commaIndex + 1) : imageUrl;
        final bytes = base64Decode(base64Str);
        return Image.memory(
          bytes,
          fit: fit,
          alignment: alignment,
          errorBuilder: (_, __, ___) => defaultError,
        );
      } catch (_) {
        return defaultError;
      }
    }

    // Handle standard network images with anti-hotlink Referer headers
    return CachedNetworkImage(
      imageUrl: imageUrl,
      fit: fit,
      alignment: alignment,
      httpHeaders: const {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Referer': 'https://movies4u.kg/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      placeholder: (_, __) => defaultPlaceholder,
      errorWidget: (_, __, ___) => defaultError,
    );
  }
}
