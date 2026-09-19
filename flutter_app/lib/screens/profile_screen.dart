import 'package:flutter/material.dart';
import '../models/movie.dart';
import '../services/app_update_service.dart';
import '../services/watchlist_service.dart';
import '../theme/app_theme.dart';
import '../widgets/telegram_button.dart';
import 'disclaimer_screen.dart';
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

  void _openDisclaimer() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const DisclaimerScreen()),
    );
  }

  Future<void> _handleCheckUpdate() async {
    final messenger = ScaffoldMessenger.of(context);
    messenger.showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
            SizedBox(width: 12),
            Text('Checking Google Play for updates...'),
          ],
        ),
        duration: Duration(seconds: 2),
      ),
    );

    await AppUpdateService.checkAndShowUpdateDialog(context, forceCheck: true);
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
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20),
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
              // Red Header Card (Styled like reference image)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFE50914), Color(0xFFB71C1C)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x40E50914),
                      blurRadius: 18,
                      offset: Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Circle Avatar with initial 'U'
                    Container(
                      width: 56,
                      height: 56,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0x33FFFFFF),
                      ),
                      child: const Center(
                        child: Text(
                          'U',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 15),

                    // User Info
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'User',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Free Guest Account • HD Streaming',
                            style: TextStyle(
                              color: Color(0xD9FFFFFF),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // TOP: APP UPDATE (Kept separate as requested)
              _buildCardGroup(
                isDark: isDark,
                children: [
                  _buildSettingsTile(
                    isDark: isDark,
                    icon: Icons.system_update_rounded,
                    title: 'App Update',
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0x1AE50914),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0x33E50914)),
                          ),
                          child: const Text(
                            'UPDATE',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFFE50914),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 20,
                          color: isDark ? Colors.grey[600] : Colors.grey[400],
                        ),
                      ],
                    ),
                    onTap: _handleCheckUpdate,
                  ),
                ],
              ),

              const SizedBox(height: 14),

              // UNIFIED OPTIONS CARD (All settings in one clean card)
              _buildCardGroup(
                isDark: isDark,
                children: [
                  // 1. Appearance
                  if (widget.onThemeChanged != null) ...[
                    _buildSettingsTile(
                      isDark: isDark,
                      icon: Icons.palette_outlined,
                      title: 'Appearance',
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            _themeModeLabel,
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            Icons.chevron_right_rounded,
                            size: 20,
                            color: isDark ? Colors.grey[600] : Colors.grey[400],
                          ),
                        ],
                      ),
                      onTap: _showThemeSelectionDialog,
                    ),
                    _buildDivider(isDark),
                  ],

                  // 2. Saved Movies
                  _buildSettingsTile(
                    isDark: isDark,
                    icon: Icons.bookmark_outline_rounded,
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
                          size: 20,
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

                  _buildDivider(isDark),

                  // 3. Disclaimer
                  _buildSettingsTile(
                    isDark: isDark,
                    icon: Icons.description_outlined,
                    title: 'Disclaimer',
                    onTap: _openDisclaimer,
                  ),

                  _buildDivider(isDark),

                  // 4. Join Telegram Channel
                  _buildSettingsTile(
                    isDark: isDark,
                    icon: Icons.near_me_rounded,
                    iconColor: const Color(0xFF229ED9),
                    iconBgColor: isDark ? const Color(0x2B229ED9) : const Color(0xFFE1F5FE),
                    title: 'Join Telegram Channel',
                    subtitle: 'Get instant movie updates',
                    titleColor: const Color(0xFF229ED9),
                    trailing: const Icon(
                      Icons.open_in_new_rounded,
                      size: 18,
                      color: Color(0xFF229ED9),
                    ),
                    onTap: openTelegram,
                  ),

                  _buildDivider(isDark),

                  // 5. Clear Local Watchlist
                  _buildSettingsTile(
                    isDark: isDark,
                    icon: Icons.delete_outline_rounded,
                    title: 'Clear Local Watchlist',
                    titleColor: Colors.redAccent,
                    onTap: _confirmClearData,
                  ),
                ],
              ),

              const SizedBox(height: 22),

              // Simple, minimal App Version footer right below Clear Local Watchlist
              Center(
                child: Text(
                  'App Version 1.0.4 (5)',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white38 : Colors.black38,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.2,
                  ),
                ),
              ),

              const SizedBox(height: 28),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
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
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
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
    required IconData icon,
    required String title,
    String? subtitle,
    Widget? trailing,
    VoidCallback? onTap,
    Color? titleColor,
    Color? iconColor,
    Color? iconBgColor,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            // Icon Container (Customizable colors, default soft red)
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: iconBgColor ??
                    (isDark ? const Color(0x26E50914) : const Color(0xFFFFEBEE)),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                icon,
                color: iconColor ?? const Color(0xFFE50914),
                size: 22,
              ),
            ),
            const SizedBox(width: 14),

            // Title & Subtitle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: FontWeight.w700,
                      color: titleColor ??
                          (isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary),
                      letterSpacing: -0.2,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? Colors.white54 : Colors.black45,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            trailing ??
                Icon(
                  Icons.chevron_right_rounded,
                  size: 20,
                  color: isDark ? Colors.grey[600] : Colors.grey[400],
                ),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Divider(
      height: 1,
      thickness: 1,
      indent: 74,
      color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder,
    );
  }
}
