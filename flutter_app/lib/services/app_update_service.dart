import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api_service.dart';

class AppUpdateService {
  // Current App Version (matches pubspec.yaml 1.0.4+5)
  static const String currentVersion = '1.0.4';
  static const int currentVersionCode = 5;

  static const String defaultPlayStoreUrl =
      'https://play.google.com/store/apps/details?id=com.movie.man&pcampaignid=web_share';

  static bool _hasCheckedThisSession = false;

  /// Check if an app update is available from the API and show the dialog
  static Future<void> checkAndShowUpdateDialog(
    BuildContext context, {
    bool forceCheck = false,
  }) async {
    if (_hasCheckedThisSession && !forceCheck) return;
    _hasCheckedThisSession = true;

    try {
      final prefs = await SharedPreferences.getInstance();

      // Check 24-hour dismissal timestamp (ignored if forceCheck or compulsory)
      final lastDismissed = prefs.getInt('app_update_dismissed_at') ?? 0;
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      final isDismissedRecently =
          (DateTime.now().millisecondsSinceEpoch - lastDismissed) < twentyFourHoursMs;

      final url = Uri.parse(
        '${ApiService.baseUrl}/app-update?version=$currentVersion&versionCode=$currentVersionCode',
      );

      final response = await http
          .get(url, headers: ApiService.requestHeaders)
          .timeout(const Duration(seconds: 8));

      if (response.statusCode != 200) {
        if (forceCheck && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Unable to connect to update server.')),
          );
        }
        return;
      }

      final data = jsonDecode(response.body);
      final bool hasUpdate = data['hasUpdate'] == true;
      // Default to true for compulsory update as requested
      final bool forceUpdate = data['forceUpdate'] ?? true;
      final String latestVersion = data['latestVersion']?.toString() ?? '1.0.5';
      final String title = data['title']?.toString() ?? 'Important App Update Required! 🚀';
      final String message = data['message']?.toString() ??
          'Updating this app is compulsory so you can watch and download all the latest movies without any errors or interruptions.';
      final String playStoreUrl =
          data['playStoreUrl']?.toString() ?? defaultPlayStoreUrl;
      final List<String> whatsNew = (data['whatsNew'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [
            '🎬 Watch all new & latest movies without issues',
            '⚡ Fixed playback errors & broken download links',
            '🚀 Faster loading speed with 4K download support',
            '🛡️ Smooth performance and bug fixes',
          ];

      if (!hasUpdate) {
        if (forceCheck && context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('You are already using the latest version of Movie Man!'),
            ),
          );
        }
        return;
      }

      // If dismissed recently and not a forced update, don't nag unless user explicitly clicked
      if (!forceCheck && !forceUpdate && isDismissedRecently) return;

      if (!context.mounted) return;

      // Small delay on initial launch to allow UI to settle
      if (!forceCheck) {
        await Future.delayed(const Duration(milliseconds: 1200));
        if (!context.mounted) return;
      }

      // Show compulsory update dialog
      await showDialog(
        context: context,
        barrierDismissible: !forceUpdate,
        builder: (dialogContext) {
          final isDark = Theme.of(dialogContext).brightness == Brightness.dark;

          return PopScope(
            canPop: !forceUpdate,
            child: Dialog(
              backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              elevation: 8,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isDark ? const Color(0x26FFFFFF) : const Color(0x14000000),
                  width: 1,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(22, 22, 22, 18),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header: App icon + Title + Version + optional close button
                    Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE50914).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.system_update_rounded,
                            color: Color(0xFFE50914),
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'App Update Required',
                                style: TextStyle(
                                  fontSize: 16.5,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Version $latestVersion Available',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white54 : Colors.black45,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (!forceUpdate)
                          IconButton(
                            icon: const Icon(Icons.close, size: 20),
                            color: isDark ? Colors.white54 : Colors.black45,
                            onPressed: () {
                              prefs.setInt(
                                'app_update_dismissed_at',
                                DateTime.now().millisecondsSinceEpoch,
                              );
                              Navigator.of(dialogContext).pop();
                            },
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Compulsory Notice Text (Simple, minimal style)
                    Text(
                      'Updating is compulsory to watch and download all the latest movies without any issues.',
                      style: TextStyle(
                        fontSize: 13.5,
                        height: 1.45,
                        color: isDark ? Colors.white70 : const Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 22),

                    // Primary Update Button with Original Google Play Store Icon
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: ElevatedButton(
                        onPressed: () async {
                          final uri = Uri.parse(playStoreUrl);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri, mode: LaunchMode.externalApplication);
                          }
                          if (!forceUpdate && dialogContext.mounted) {
                            prefs.setInt(
                              'app_update_dismissed_at',
                              DateTime.now().millisecondsSinceEpoch,
                            );
                            Navigator.of(dialogContext).pop();
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE50914),
                          foregroundColor: Colors.white,
                          elevation: 2,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            GooglePlayLogo(size: 20),
                            SizedBox(width: 10),
                            Text(
                              'Update on Google Play',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Optional Later Button
                    if (!forceUpdate) ...[
                      const SizedBox(height: 6),
                      SizedBox(
                        width: double.infinity,
                        height: 36,
                        child: TextButton(
                          onPressed: () {
                            prefs.setInt(
                              'app_update_dismissed_at',
                              DateTime.now().millisecondsSinceEpoch,
                            );
                            Navigator.of(dialogContext).pop();
                          },
                          child: Text(
                            'Later',
                            style: TextStyle(
                              fontSize: 12.5,
                              color: isDark ? Colors.white54 : Colors.black45,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      );
    } catch (_) {
      // Silently catch errors if network is down
    }
  }
}

/// Authentic 4-color Google Play Store Vector Icon
class GooglePlayLogo extends StatelessWidget {
  final double size;
  const GooglePlayLogo({super.key, this.size = 20});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size * 0.9,
      height: size,
      child: CustomPaint(
        painter: _GooglePlayPainter(),
      ),
    );
  }
}

class _GooglePlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Smooth rounded triangle clip for the Google Play logo shape
    final clipPath = Path()
      ..moveTo(w * 0.08, h * 0.03)
      ..quadraticBezierTo(0, 0, 0, h * 0.12)
      ..lineTo(0, h * 0.88)
      ..quadraticBezierTo(0, h, w * 0.08, h * 0.97)
      ..quadraticBezierTo(w * 0.16, h, w * 0.22, h * 0.95)
      ..lineTo(w * 0.94, h * 0.54)
      ..quadraticBezierTo(w, h * 0.5, w * 0.94, h * 0.46)
      ..lineTo(w * 0.22, h * 0.05)
      ..quadraticBezierTo(w * 0.16, 0, w * 0.08, h * 0.03)
      ..close();

    canvas.clipPath(clipPath);

    final centerPoint = Offset(w * 0.48, h * 0.5);

    // 1. Blue (Left Triangle)
    final bluePath = Path()
      ..moveTo(0, 0)
      ..lineTo(centerPoint.dx, centerPoint.dy)
      ..lineTo(0, h)
      ..close();
    final bluePaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF00C3FF), Color(0xFF007AFE)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawPath(bluePath, bluePaint);

    // 2. Green (Top Segment)
    final greenPath = Path()
      ..moveTo(0, 0)
      ..lineTo(w * 0.72, h * 0.36)
      ..lineTo(centerPoint.dx, centerPoint.dy)
      ..close();
    final greenPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFF00E676), Color(0xFF00D563)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawPath(greenPath, greenPaint);

    // 3. Red (Bottom Segment)
    final redPath = Path()
      ..moveTo(0, h)
      ..lineTo(centerPoint.dx, centerPoint.dy)
      ..lineTo(w * 0.72, h * 0.64)
      ..close();
    final redPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFFF334C), Color(0xFFFF1744)],
        begin: Alignment.bottomLeft,
        end: Alignment.topRight,
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawPath(redPath, redPaint);

    // 4. Yellow (Right Tip)
    final yellowPath = Path()
      ..moveTo(centerPoint.dx, centerPoint.dy)
      ..lineTo(w * 0.72, h * 0.36)
      ..lineTo(w, h * 0.5)
      ..lineTo(w * 0.72, h * 0.64)
      ..close();
    final yellowPaint = Paint()
      ..shader = const LinearGradient(
        colors: [Color(0xFFFFD600), Color(0xFFFFB300)],
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawPath(yellowPath, yellowPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
