import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';

class DisclaimerScreen extends StatelessWidget {
  const DisclaimerScreen({super.key});

  Widget _buildSection(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String content,
    List<String>? bulletPoints,
    Color? accentColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = accentColor ?? AppTheme.primaryRed;

    return Container(
      margin: const EdgeInsets.only(bottom: 16.0),
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : AppTheme.lightCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 18, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            content,
            style: TextStyle(
              fontSize: 13,
              height: 1.55,
              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
            ),
          ),
          if (bulletPoints != null && bulletPoints.isNotEmpty) ...[
            const SizedBox(height: 10),
            ...bulletPoints.map(
              (bp) => Padding(
                padding: const EdgeInsets.only(left: 6.0, bottom: 5.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('• ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: color)),
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
          'Legal Disclaimer',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Overview Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              margin: const EdgeInsets.only(bottom: 18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF1F1A24), const Color(0xFF141926)]
                      : [const Color(0xFFFFF3F2), const Color(0xFFF1F5F9)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: AppTheme.primaryRed.withOpacity(0.25),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryRed.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.shield_rounded,
                      color: AppTheme.primaryRed,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Movie Man Platform Notice',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Please review our operational terms, non-hosting policies, and copyright removal guidelines below.',
                          style: TextStyle(
                            fontSize: 12.5,
                            height: 1.45,
                            color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // 1. Non-Hosting & Third-Party Index
            _buildSection(
              context,
              icon: Icons.cloud_off_rounded,
              accentColor: Colors.blue,
              title: '1. Third-Party Index & Non-Hosting Notice',
              content:
                  'Movie Man functions exclusively as an entertainment catalog, search directory, and cinema guide. The application does not host, upload, broadcast, or store any video media files on its proprietary servers.',
              bulletPoints: [
                'All movie metadata, plot overviews, and external links are sourced from publicly available third-party websites across the internet.',
                'The platform only organizes and shares information that is already freely accessible online for educational, preview, and promotional purposes.',
              ],
            ),

            // 2. Anti-Piracy & Preview Purpose
            _buildSection(
              context,
              icon: Icons.gavel_rounded,
              accentColor: Colors.amber,
              title: '2. Anti-Piracy & Fair Use Statement',
              content:
                  'We uphold intellectual property standards and strictly oppose all forms of copyright infringement or piracy. No copyrighted video files are stored within our systems.',
              bulletPoints: [
                'All media links and references accessible through this app are intended purely for preview, synopsis reading, testing, and educational reviews.',
                'We do not encourage or endorse unauthorized sharing of copyrighted works.',
              ],
            ),

            // 3. Support Creators
            _buildSection(
              context,
              icon: Icons.favorite_rounded,
              accentColor: AppTheme.primaryRed,
              title: '3. Supporting Content Creators',
              content:
                  'We strongly encourage all cinema enthusiasts to support original filmmakers, production studios, and artists. Please purchase authentic digital copies, theater tickets, Blu-rays, or DVDs through official licensed platforms to support the entertainment industry.',
            ),

            // 4. Terms of Usage & Liability Release
            _buildSection(
              context,
              icon: Icons.assignment_turned_in_outlined,
              accentColor: Colors.teal,
              title: '4. Agreement & Terms of Usage',
              content:
                  'If you do not agree with any part of this disclaimer, please discontinue using and remove this application immediately.',
              bulletPoints: [
                'By retaining and navigating this app, you acknowledge having read, understood, and agreed to this disclaimer.',
                'You agree to release this application and its developers from any responsibility or liabilities arising from individual user actions.',
              ],
            ),

            // 5. Trademarks & Intellectual Property
            _buildSection(
              context,
              icon: Icons.copyright_rounded,
              accentColor: Colors.deepPurpleAccent,
              title: '5. Trademarks & Public Domain Assets',
              content:
                  'All studio trademarks, logos, movie posters, and promotional graphics belong to their respective copyright owners. Visual assets shown within the application are believed to be in the public domain or sourced from open web indexes.',
            ),

            // 6. DMCA & Takedown Request
            _buildSection(
              context,
              icon: Icons.mail_outline_rounded,
              accentColor: Colors.orange,
              title: '6. DMCA & Prompt Content Takedown',
              content:
                  'If you are a copyright owner or an authorized legal representative and believe that any material indexed on this platform infringes your rights, or if any file appears improperly linked, please contact us immediately with valid documentation. We will review the submission and unlink the content promptly.',
            ),

            // Contact Action Container
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.primaryRed.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primaryRed.withOpacity(0.25)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.mark_email_read_rounded, color: AppTheme.primaryRed, size: 22),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'DMCA Inquiries & Takedown Email:',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                        SizedBox(height: 2),
                        SelectableText(
                          'anilarangi6@gmail.com',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primaryRed,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.copy_rounded, size: 18, color: AppTheme.primaryRed),
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

            // 7. 24-Hour Preview Advisory
            _buildSection(
              context,
              icon: Icons.timer_outlined,
              accentColor: Colors.indigo,
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
