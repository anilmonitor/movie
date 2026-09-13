import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/movie.dart';
import '../services/watchlist_service.dart';
import '../theme/app_theme.dart';
import '../widgets/telegram_button.dart';
import 'disclaimer_screen.dart';
import 'privacy_policy_screen.dart';
import 'watchlist_screen.dart';

class ProfileScreen extends StatefulWidget {
  final ThemeMode currentThemeMode;
  final ValueChanged<ThemeMode>? onThemeChanged;

  const ProfileScreen({
    super.key,
    this.currentThemeMode = ThemeMode.system,
    this.onThemeChanged,
  });

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  List<Movie> _savedMovies = [];

  String get _themeModeLabel {
    switch (widget.currentThemeMode) {
      case ThemeMode.system:
        return 'System Default';
      case ThemeMode.dark:
        return 'Dark Mode';
      case ThemeMode.light:
        return 'Light Mode';
    }
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final list = await WatchlistService.getWatchlist();
    if (mounted) {
      setState(() {
        _savedMovies = list;
      });
    }
  }

  void _openPrivacyPolicy() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen()),
    );
  }

  void _openDisclaimer() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const DisclaimerScreen()),
    );
  }

  void _showThemeSelectionDialog() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF161D2C) : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
        ),
        titlePadding: const EdgeInsets.fromLTRB(20, 18, 20, 6),
        contentPadding: const EdgeInsets.symmetric(vertical: 6),
        title: Text(
          'Choose Theme',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            RadioListTile<ThemeMode>(
              value: ThemeMode.system,
              groupValue: widget.currentThemeMode,
              activeColor: AppTheme.primaryRed,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14),
              title: const Text(
                'System Default',
                style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500),
              ),
              onChanged: (val) {
                if (val != null) {
                  Navigator.pop(ctx);
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    widget.onThemeChanged?.call(val);
                  });
                }
              },
            ),
            RadioListTile<ThemeMode>(
              value: ThemeMode.dark,
              groupValue: widget.currentThemeMode,
              activeColor: AppTheme.primaryRed,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14),
              title: const Text(
                'Dark Mode',
                style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500),
              ),
              onChanged: (val) {
                if (val != null) {
                  Navigator.pop(ctx);
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    widget.onThemeChanged?.call(val);
                  });
                }
              },
            ),
            RadioListTile<ThemeMode>(
              value: ThemeMode.light,
              groupValue: widget.currentThemeMode,
              activeColor: AppTheme.primaryRed,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14),
              title: const Text(
                'Light Mode',
                style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500),
              ),
              onChanged: (val) {
                if (val != null) {
                  Navigator.pop(ctx);
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    widget.onThemeChanged?.call(val);
                  });
                }
              },
            ),
          ],
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(
              foregroundColor: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
            ),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  void _showContactDialog() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : AppTheme.lightCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
        ),
        titlePadding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
        title: Text(
          'Contact Support',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
          ),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Email us for support or copyright inquiries:',
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF141A28) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
                ),
              ),
              child: const SelectableText(
                'anilarangi6@gmail.com',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13.5,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Clipboard.setData(const ClipboardData(text: 'anilarangi6@gmail.com'));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Email copied to clipboard!')),
              );
            },
            child: const Text('Copy Email'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(
              foregroundColor: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
            ),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _confirmClearData() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppTheme.darkCard : AppTheme.lightCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
        ),
        title: const Text(
          'Clear Watchlist?',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17),
        ),
        content: Text(
          'This will remove all saved bookmarks from your device.',
          style: TextStyle(
            fontSize: 13,
            color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            style: TextButton.styleFrom(
              foregroundColor: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
            ),
            child: const Text('Cancel'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: Colors.redAccent),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              for (final m in _savedMovies) {
                await WatchlistService.toggleWatchlist(m);
              }
              if (ctx.mounted) Navigator.pop(ctx);
              _loadData();
              messenger.showSnackBar(
                const SnackBar(content: Text('Watchlist cleared.')),
              );
            },
            child: const Text('Clear', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
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
          'Profile',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        centerTitle: false,
        actions: const [
          TelegramButton(),
          SizedBox(width: 10),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: isDark ? Colors.white : Colors.black87,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile Header (Guest Account with DP Avatar)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppTheme.darkCard : AppTheme.lightCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
                  ),
                ),
                child: Row(
                  children: [
                    // DP (Display Picture) Avatar
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark ? const Color(0xFF1E2638) : const Color(0xFFE2E8F0),
                        border: Border.all(
                          color: isDark ? Colors.white.withOpacity(0.12) : Colors.black.withOpacity(0.08),
                          width: 1.5,
                        ),
                      ),
                      child: Icon(
                        Icons.person_rounded,
                        size: 30,
                        color: isDark ? Colors.grey[300] : Colors.grey[700],
                      ),
                    ),
                    const SizedBox(width: 14),

                    // User Info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Guest Account',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Signed in as Guest',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // SECTION 1: PREFERENCES
              _buildSectionHeader('PREFERENCES', isDark),
              const SizedBox(height: 6),
              _buildCardGroup(
                isDark: isDark,
                children: [
                  if (widget.onThemeChanged != null)
                    _buildSettingsTile(
                      isDark: isDark,
                      title: 'Appearance',
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _themeModeLabel,
                            style: TextStyle(
                              fontSize: 13,
                              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            Icons.chevron_right_rounded,
                            size: 18,
                            color: isDark ? Colors.grey[600] : Colors.grey[400],
                          ),
                        ],
                      ),
                      onTap: _showThemeSelectionDialog,
                    ),

                  if (widget.onThemeChanged != null)
                    _buildDivider(isDark),

                  _buildSettingsTile(
                    isDark: isDark,
                    title: 'Saved Movies',
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (_savedMovies.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            margin: const EdgeInsets.only(right: 6),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white.withOpacity(0.08) : const Color(0xFFE2E8F0),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${_savedMovies.length}',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white70 : Colors.black87,
                              ),
                            ),
                          ),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 18,
                          color: isDark ? Colors.grey[600] : Colors.grey[400],
                        ),
                      ],
                    ),
                    onTap: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const WatchlistScreen()),
                      );
                      _loadData();
                    },
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // SECTION 2: ABOUT & LEGAL (No icons, no subtitles)
              _buildSectionHeader('ABOUT & LEGAL', isDark),
              const SizedBox(height: 6),
              _buildCardGroup(
                isDark: isDark,
                children: [
                  _buildSettingsTile(
                    isDark: isDark,
                    title: 'Disclaimer & DMCA',
                    trailing: Icon(
                      Icons.chevron_right_rounded,
                      size: 18,
                      color: isDark ? Colors.grey[600] : Colors.grey[400],
                    ),
                    onTap: _openDisclaimer,
                  ),

                  _buildDivider(isDark),

                  _buildSettingsTile(
                    isDark: isDark,
                    title: 'Privacy Policy',
                    trailing: Icon(
                      Icons.chevron_right_rounded,
                      size: 18,
                      color: isDark ? Colors.grey[600] : Colors.grey[400],
                    ),
                    onTap: _openPrivacyPolicy,
                  ),

                  _buildDivider(isDark),

                  _buildSettingsTile(
                    isDark: isDark,
                    title: 'App Version',
                    trailing: Text(
                      'v1.0.1 (2)',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // SECTION 3: SUPPORT & STORAGE (No icons, no subtitles)
              _buildSectionHeader('SUPPORT & STORAGE', isDark),
              const SizedBox(height: 6),
              _buildCardGroup(
                isDark: isDark,
                children: [
                  _buildSettingsTile(
                    isDark: isDark,
                    title: 'Join Telegram Channel',
                    titleColor: const Color(0xFF229ED9),
                    trailing: const Icon(
                      Icons.open_in_new_rounded,
                      size: 16,
                      color: Color(0xFF229ED9),
                    ),
                    onTap: openTelegram,
                  ),

                  _buildDivider(isDark),

                  _buildSettingsTile(
                    isDark: isDark,
                    title: 'Developer Support',
                    trailing: Icon(
                      Icons.chevron_right_rounded,
                      size: 18,
                      color: isDark ? Colors.grey[600] : Colors.grey[400],
                    ),
                    onTap: _showContactDialog,
                  ),

                  _buildDivider(isDark),

                  _buildSettingsTile(
                    isDark: isDark,
                    title: 'Clear Local Watchlist',
                    titleColor: Colors.redAccent,
                    onTap: _confirmClearData,
                  ),
                ],
              ),

              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.1,
          color: isDark ? Colors.grey[500] : Colors.grey[500],
        ),
      ),
    );
  }

  Widget _buildCardGroup({required bool isDark, required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppTheme.darkCard : AppTheme.lightCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: children,
      ),
    );
  }

  Widget _buildSettingsTile({
    required bool isDark,
    required String title,
    Widget? trailing,
    VoidCallback? onTap,
    Color? titleColor,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w500,
                  color: titleColor ?? (isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary),
                ),
              ),
            ),
            ?trailing,
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(
      height: 1,
      thickness: 1,
      indent: 16,
      color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
    );
  }
}
