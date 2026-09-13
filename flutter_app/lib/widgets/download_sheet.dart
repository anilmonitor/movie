import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/movie.dart';
import '../theme/app_theme.dart';

class DownloadSheet extends StatelessWidget {
  final Movie movie;

  const DownloadSheet({super.key, required this.movie});

  static void show(BuildContext context, Movie movie) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DownloadSheet(movie: movie),
    );
  }

  Future<void> _launchDownload(BuildContext context, String url) async {
    final navigator = Navigator.of(context, rootNavigator: true);
    navigator.pop();

    try {
      final uri = Uri.parse(url.trim());
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      }
    } catch (_) {
      try {
        final uri = Uri.parse(url.trim());
        await launchUrl(uri, mode: LaunchMode.platformDefault);
      } catch (err) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open external browser for download.')),
          );
        }
      }
    }
  }

  bool _isZip(DownloadLink link) {
    final combined = '${link.title} ${link.url}'.toLowerCase();
    final zipRegex = RegExp(r'\b(zip|batch|pack|all[\s-_]*episodes|complete[\s-_]*pack|bundle|rar|7z)\b|\.zip\b', caseSensitive: false);
    return zipRegex.hasMatch(combined);
  }

  String? _detectPart(DownloadLink link) {
    final combined = '${link.title} ${link.url}';

    // Match "Part 1", "Part-2", "Pt 1", "Pt. 2"
    final partMatch = RegExp(r'\b(?:Part|Pt\.?)\s*[-_]?\s*([0-9]+)\b', caseSensitive: false).firstMatch(combined);
    if (partMatch != null) {
      return 'Part ${partMatch.group(1)}';
    }

    // Match "Episode 1", "Ep 01", "Ep. 1", "E01"
    final epMatch = RegExp(r'\b(?:Episode|Ep\.?|E)\s*[-_]?\s*([0-9]{1,3})\b', caseSensitive: false).firstMatch(combined);
    if (epMatch != null) {
      final num = int.tryParse(epMatch.group(1) ?? '') ?? epMatch.group(1);
      return 'Episode $num';
    }

    // Match "Season 1", "S01"
    final seasonMatch = RegExp(r'\b(?:Season|S)\s*[-_]?\s*([0-9]{1,2})\b', caseSensitive: false).firstMatch(combined);
    if (seasonMatch != null) {
      return 'Season ${seasonMatch.group(1)}';
    }

    return null;
  }

  String? _extractSize(DownloadLink link) {
    if (link.size != null && link.size!.trim().isNotEmpty) {
      return link.size!.trim();
    }
    final match = RegExp(r'\[?\b([0-9.]+\s*(?:GB|MB|gb|mb|kb|KB))\b\]?').firstMatch(link.title);
    if (match != null) {
      return match.group(1)?.trim();
    }
    return null;
  }

  String _extractQuality(DownloadLink link) {
    if (link.quality != null && link.quality!.trim().isNotEmpty) {
      return link.quality!.trim().toUpperCase();
    }
    final match = RegExp(r'\b(480p|720p|1080p|2160p|4K|2K|FHD|UHD|HEVC)\b', caseSensitive: false).firstMatch(link.title);
    if (match != null) {
      return match.group(1)!.toUpperCase();
    }
    return 'HD';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final links = movie.downloadLinks;
    final screenHeight = MediaQuery.of(context).size.height;

    return Container(
      constraints: BoxConstraints(maxHeight: screenHeight * 0.85),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F1420) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(
          color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
          width: 1,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.35),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryRed.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.download_rounded, color: AppTheme.primaryRed, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Download Options',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                      ),
                    ),
                    Text(
                      movie.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Download Link Tiles
          if (links.isNotEmpty)
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: links.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final link = links[index];
                  final isZip = _isZip(link);
                  final part = _detectPart(link);
                  final size = _extractSize(link);
                  final quality = _extractQuality(link);

                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF161E30) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isZip
                            ? (isDark ? Colors.amber.shade700.withOpacity(0.5) : Colors.amber.shade600.withOpacity(0.7))
                            : (isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
                        width: isZip ? 1.5 : 1,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Badges Row: Quality, Part, Zip, Size
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          children: [
                            // Quality Tag
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryRed,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                quality,
                                style: const TextStyle(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                            ),

                            // Part / Episode Tag
                            if (part != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0284C7).withOpacity(isDark ? 0.25 : 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: const Color(0xFF0284C7).withOpacity(0.55),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.layers_rounded, size: 12, color: Color(0xFF0284C7)),
                                    const SizedBox(width: 3.5),
                                    Text(
                                      part,
                                      style: const TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFF0284C7),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                            // ZIP Pack Tag
                            if (isZip)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                                decoration: BoxDecoration(
                                  color: Colors.amber.withOpacity(isDark ? 0.25 : 0.18),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isDark ? Colors.amber.shade400.withOpacity(0.7) : Colors.amber.shade700,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.folder_zip_rounded,
                                      size: 13,
                                      color: isDark ? Colors.amber.shade300 : Colors.amber.shade900,
                                    ),
                                    const SizedBox(width: 3.5),
                                    Text(
                                      'ZIP PACK',
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.4,
                                        color: isDark ? Colors.amber.shade300 : Colors.amber.shade900,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                            // Size Tag
                            if (size != null)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                                decoration: BoxDecoration(
                                  color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.06),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.sd_storage_rounded,
                                      size: 11.5,
                                      color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                                    ),
                                    const SizedBox(width: 3.5),
                                    Text(
                                      size,
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),

                        const SizedBox(height: 10),

                        // Full Name (Never truncated)
                        Text(
                          link.title,
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.45,
                            fontWeight: FontWeight.w700,
                            color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                          ),
                        ),

                        const SizedBox(height: 12),

                        // Action Buttons: Copy Link & Download
                        Row(
                          children: [
                            // Copy Link
                            OutlinedButton.icon(
                              onPressed: () {
                                Clipboard.setData(ClipboardData(text: link.url));
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Download link copied to clipboard!')),
                                );
                              },
                              icon: const Icon(Icons.copy_rounded, size: 14),
                              label: const Text(
                                'Copy Link',
                                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
                              ),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                                side: BorderSide(
                                  color: isDark ? Colors.white24 : Colors.black12,
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                            ),

                            const Spacer(),

                            // Download Button (Replaces the "Start" button)
                            ElevatedButton.icon(
                              onPressed: () => _launchDownload(context, link.url),
                              icon: const Icon(Icons.download_rounded, size: 15),
                              label: const Text(
                                'Download',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primaryRed,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                elevation: 2,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
            )
          else
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF161E30) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                children: [
                  const Text(
                    'Direct links available on source page.',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 10),
                  ElevatedButton.icon(
                    onPressed: () => _launchDownload(context, 'https://allmoviesite.vercel.app/movie/${movie.slug}'),
                    icon: const Icon(Icons.open_in_new, size: 16),
                    label: const Text('Open Download Mirrors'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primaryRed,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
