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
  static Future<void> checkAndShowUpdateDialog(BuildContext context) async {
    if (_hasCheckedThisSession) return;
    _hasCheckedThisSession = true;

    try {
      final prefs = await SharedPreferences.getInstance();

      // Check 24-hour dismissal timestamp
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

      if (response.statusCode != 200) return;

      final data = jsonDecode(response.body);
      final bool hasUpdate = data['hasUpdate'] == true;
      final bool forceUpdate = data['forceUpdate'] == true;
      final String latestVersion = data['latestVersion']?.toString() ?? '1.0.5';
      final String title = data['title']?.toString() ?? 'New Update Available! 🚀';
      final String message = data['message']?.toString() ??
          'A newer version of Movie Man is available on Google Play Store with latest movies and bug fixes.';
      final String playStoreUrl =
          data['playStoreUrl']?.toString() ?? defaultPlayStoreUrl;
      final List<String> whatsNew = (data['whatsNew'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [
            '⚡ Faster movie streaming & 4K download links',
            '🎬 Live New Movies discovery system',
            '🐞 Bug fixes and performance improvements',
          ];

      if (!hasUpdate) return;

      // If dismissed recently and not a forced update, don't nag user
      if (!forceUpdate && isDismissedRecently) return;

      if (!context.mounted) return;

      // Small delay to allow home screen UI to settle
      await Future.delayed(const Duration(milliseconds: 1500));
      if (!context.mounted) return;

      // Show update dialog
      await showDialog(
        context: context,
        barrierDismissible: !forceUpdate,
        builder: (dialogContext) {
          final isDark = Theme.of(dialogContext).brightness == Brightness.dark;

          return PopScope(
            canPop: !forceUpdate,
            child: Dialog(
              backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
                side: BorderSide(
                  color: isDark ? const Color(0x33FFFFFF) : const Color(0x1A000000),
                  width: 1,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.all(22.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header Badge & Close Button
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0x1AE50914),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0x4DE50914)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.stars_rounded, color: Color(0xFFE50914), size: 14),
                              const SizedBox(width: 4),
                              Text(
                                'v$latestVersion UPDATE',
                                style: const TextStyle(
                                  color: Color(0xFFE50914),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (!forceUpdate)
                          GestureDetector(
                            onTap: () {
                              prefs.setInt(
                                'app_update_dismissed_at',
                                DateTime.now().millisecondsSinceEpoch,
                              );
                              Navigator.of(dialogContext).pop();
                            },
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0x1AFFFFFF) : const Color(0x0D000000),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.close,
                                size: 18,
                                color: isDark ? Colors.white70 : Colors.black54,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // App Title & Description
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFFE50914), Color(0xFFFF5252)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: const [
                              BoxShadow(
                                color: Color(0x40E50914),
                                blurRadius: 12,
                                offset: Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.system_update_rounded,
                            color: Colors.white,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w900,
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                  letterSpacing: -0.3,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                message,
                                style: TextStyle(
                                  fontSize: 12,
                                  height: 1.4,
                                  color: isDark ? Colors.white60 : Colors.black54,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // What's New Box
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0x14FFFFFF) : const Color(0x08000000),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isDark ? const Color(0x1AFFFFFF) : const Color(0x0F000000),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.new_releases_rounded, size: 14, color: Color(0xFF10B981)),
                              const SizedBox(width: 6),
                              Text(
                                "What's New in This Version:",
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white70 : Colors.black87,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ...whatsNew.map(
                            (item) => Padding(
                              padding: const EdgeInsets.only(bottom: 4.0),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.check_circle_rounded,
                                      size: 13, color: Color(0xFFF59E0B)),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      item,
                                      style: TextStyle(
                                        fontSize: 11,
                                        height: 1.3,
                                        color: isDark ? Colors.white70 : Colors.black87,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Action Buttons
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
                          elevation: 6,
                          shadowColor: const Color(0x66E50914),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.shop_rounded, size: 18),
                            SizedBox(width: 8),
                            Text(
                              'Update on Google Play',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    if (!forceUpdate) ...[
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        height: 38,
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
                              fontSize: 12,
                              color: isDark ? Colors.white54 : Colors.black45,
                              fontWeight: FontWeight.w600,
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
