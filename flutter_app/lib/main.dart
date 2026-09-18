import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme/app_theme.dart';
import 'screens/main_navigation_screen.dart';
import 'services/webview_api_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Warm up WebViewApiClient in background to resolve Cloudflare session
  WebViewApiClient.instance.ensureInitialized();

  // Set default status bar style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  final prefs = await SharedPreferences.getInstance();
  final themeModeStr = prefs.getString('app_theme_mode') ?? '';
  ThemeMode initialMode;
  if (themeModeStr == 'dark') {
    initialMode = ThemeMode.dark;
  } else if (themeModeStr == 'light') {
    initialMode = ThemeMode.light;
  } else if (themeModeStr == 'system') {
    initialMode = ThemeMode.system;
  } else {
    if (prefs.containsKey('is_dark_theme')) {
      initialMode = prefs.getBool('is_dark_theme') == true ? ThemeMode.dark : ThemeMode.light;
    } else {
      initialMode = ThemeMode.system;
    }
  }

  runApp(MovieManApp(initialThemeMode: initialMode));
}

class MovieManApp extends StatefulWidget {
  final ThemeMode initialThemeMode;

  const MovieManApp({super.key, required this.initialThemeMode});

  @override
  State<MovieManApp> createState() => _MovieManAppState();
}

class _MovieManAppState extends State<MovieManApp> {
  late ThemeMode _themeMode;

  @override
  void initState() {
    super.initState();
    _themeMode = widget.initialThemeMode;
  }

  void _setThemeMode(ThemeMode mode) {
    if (_themeMode == mode) return;
    setState(() => _themeMode = mode);
    SharedPreferences.getInstance().then((prefs) {
      prefs.setString('app_theme_mode', mode.name);
      prefs.setBool('is_dark_theme', mode == ThemeMode.dark);
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Movie Man',
      debugShowCheckedModeBanner: false,
      themeAnimationDuration: Duration.zero,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: _themeMode,
      home: MainNavigationScreen(
        currentThemeMode: _themeMode,
        onThemeChanged: _setThemeMode,
      ),
    );
  }
}
