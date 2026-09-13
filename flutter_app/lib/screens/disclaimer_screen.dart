import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

class DisclaimerScreen extends StatelessWidget {
  const DisclaimerScreen({super.key});

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required String content,
    List<String>? bulletPoints,
  }) {
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
        title: const Text(
          'Disclaimer',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Legal & Compliance Notice',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Please review our operational terms, non-hosting policies, and copyright guidelines.',
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 20),

            _buildSection(
              context,
              title: '1. Third-Party Index & Non-Hosting Notice',
              content:
                  'This application functions exclusively as an entertainment catalog, search directory, and cinema guide. The application does not host, upload, broadcast, or store any video media files on its proprietary servers.',
              bulletPoints: [
                'All movie metadata, plot overviews, and external links are sourced from publicly available third-party websites across the internet.',
                'The platform only organizes and shares information that is already freely accessible online for educational, preview, and promotional purposes.',
              ],
            ),

            _buildSection(
              context,
              title: '2. Anti-Piracy & Fair Use Statement',
              content:
                  'We uphold intellectual property standards and strictly oppose all forms of copyright infringement or piracy. No copyrighted video files are stored within our systems.',
              bulletPoints: [
                'All media links and references accessible through this app are intended purely for preview, synopsis reading, testing, and educational reviews.',
                'We do not encourage or endorse unauthorized sharing of copyrighted works.',
              ],
            ),

            _buildSection(
              context,
              title: '3. Supporting Content Creators',
              content:
                  'We strongly encourage all cinema enthusiasts to support original filmmakers, production studios, and artists. Please purchase authentic digital copies, theater tickets, Blu-rays, or DVDs through official licensed platforms to support the entertainment industry.',
            ),

            _buildSection(
              context,
              title: '4. Agreement & Terms of Usage',
              content:
                  'If you do not agree with any part of this disclaimer, please discontinue using and remove this application immediately.',
              bulletPoints: [
                'By retaining and navigating this app, you acknowledge having read, understood, and agreed to this disclaimer.',
                'You agree to release this application and its developers from any responsibility or liabilities arising from individual user actions.',
              ],
            ),

            _buildSection(
              context,
              title: '5. Trademarks & Public Domain Assets',
              content:
                  'All studio trademarks, logos, movie posters, and promotional graphics belong to their respective copyright owners. Visual assets shown within the application are believed to be in the public domain or sourced from open web indexes.',
            ),

            _buildSection(
              context,
              title: '6. DMCA & Content Takedown',
              content:
                  'If you are a copyright owner or an authorized legal representative and believe that any material indexed on this platform infringes your rights, please contact us immediately with valid documentation. We will review the submission and unlink the content promptly.',
            ),

            // Simple Minimal Contact Line
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.04) : Colors.black.withOpacity(0.03),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'DMCA Inquiries & Takedown Email:',
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark ? Colors.grey[400] : Colors.grey[700],
                          ),
                        ),
                        const SizedBox(height: 3),
                        const SelectableText(
                          'anilarangi6@gmail.com',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.copy_rounded, size: 18),
                    tooltip: 'Copy Email',
                    onPressed: () {
                      Clipboard.setData(const ClipboardData(text: 'anilarangi6@gmail.com'));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Email copied to clipboard!')),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),

            _buildSection(
              context,
              title: '7. 24-Hour Preview Advisory',
              content:
                  'Users exploring any external reference or educational links are advised to delete any downloaded preview files within 24 hours and purchase the authorized original copies from licensed platforms.',
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
