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
                              const Icon(Icons.warning_amber_rounded, color: Color(0xFFE50914), size: 14),
                              const SizedBox(width: 4),
                              Text(
                                forceUpdate ? 'COMPULSORY UPDATE (v$latestVersion)' : 'v$latestVersion UPDATE',
                                style: const TextStyle(
                                  color: Color(0xFFE50914),
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
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

                    // App Title & Icon
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
                                  color: isDark ? Colors.white70 : Colors.black54,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Compulsory Notice Box in clean, normal English
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0x1AE50914),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0x4DE50914)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.info_outline_rounded, color: Color(0xFFE50914), size: 17),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Updating is compulsory to watch and download all newly added movies without any issues.',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                height: 1.35,
                                color: isDark ? const Color(0xFFFF8A80) : const Color(0xFFD32F2F),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

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
                                "What's in This Update:",
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

                    // Primary Compulsory Update Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
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
                            Icon(Icons.shop_rounded, size: 19),
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
