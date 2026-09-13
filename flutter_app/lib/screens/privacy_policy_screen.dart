import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  Widget _buildSection(BuildContext context, String title, String content, {List<String>? bulletPoints}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 22.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            content,
            style: TextStyle(
              fontSize: 13,
              height: 1.5,
              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
            ),
          ),
          if (bulletPoints != null && bulletPoints.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...bulletPoints.map(
              (bp) => Padding(
                padding: const EdgeInsets.only(left: 6.0, bottom: 4.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '• ',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: isDark ? Colors.grey[400] : Colors.grey[700],
                      ),
                    ),
                    Expanded(
                      child: Text(
                        bp,
                        style: TextStyle(
                          fontSize: 12.5,
                          height: 1.45,
                          color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy Policy', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Privacy Policy',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Your privacy is important to us. Read below for full details on how application data is handled.',
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 20),

            _buildSection(
              context,
              '1. Overview',
              'This application is an entertainment discovery and cinema guide. This service is provided at no cost and is intended for use as an informational reference to explore movie descriptions, release years, ratings, cast information, and categories.',
            ),

            _buildSection(
              context,
              '2. Information Collection and Use',
              'For a smooth experience, the application may process non-personally identifiable technical telemetry provided by your mobile device:',
              bulletPoints: [
                'Device Information: Device model and operating system version to render application UI correctly.',
                'Log Data: Error stack traces and diagnostics generated during crashes to fix technical bugs.',
                'Local Storage: Saved watchlist bookmarks are stored locally on your device storage and never sent to external servers.',
              ],
            ),

            _buildSection(
              context,
              '3. Information We Do Not Collect',
              'We respect your privacy and do not collect sensitive user data:',
              bulletPoints: [
                'We do not collect names, phone numbers, or personal accounts.',
                'We do not collect financial, banking, or payment information.',
                'We do not track or request GPS location data.',
                'We do not request access to contacts, photos, microphone, or camera.',
              ],
            ),

            _buildSection(
              context,
              '4. Third-Party Services',
              'The application integrates with standard Google Play developer services that process anonymous telemetry under their independent terms.',
            ),

            _buildSection(
              context,
              '5. Content & Non-Hosting Notice',
              'The application functions strictly as an informational cinema guide and catalog. All movie titles, synopses, and promotional assets are the intellectual property of their respective copyright holders. We do not host, upload, or store video media on our servers; all information is indexed from public third-party sources online.',
            ),

            _buildSection(
              context,
              '6. Children\'s Privacy',
              'These services do not address anyone under the age of 13. We do not knowingly collect personal data from children under 13.',
            ),

            _buildSection(
              context,
              '7. Security',
              'All network requests use secure SSL/HTTPS encryption. Local preferences can be cleared anytime by clearing the app cache or storage.',
            ),

            _buildSection(
              context,
              '8. Contact Developer Support',
              'If you have any questions, feedback, or inquiries regarding this Privacy Policy, contact us directly at anilarangi6@gmail.com.',
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
