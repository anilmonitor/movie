import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme/app_theme.dart';
import 'screens/main_navigation_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set default status bar style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  final prefs = await SharedPreferences.getInstance();
  final isDarkSaved = prefs.getBool('is_dark_theme') ?? false; // Default to Light Mode as requested

  runApp(MovieManApp(initialDarkMode: isDarkSaved));
}

class MovieManApp extends StatefulWidget {
  final bool initialDarkMode;

  const MovieManApp({super.key, required this.initialDarkMode});

  @override
  State<MovieManApp> createState() => _MovieManAppState();
}

class _MovieManAppState extends State<MovieManApp> {
  late bool _isDarkMode;

  @override
  void initState() {
    super.initState();
    _isDarkMode = widget.initialDarkMode;
  }

  void _toggleTheme() async {
    setState(() => _isDarkMode = !_isDarkMode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_dark_theme', _isDarkMode);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Movie Man',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light, // Default light
      home: MainNavigationScreen(onToggleTheme: _toggleTheme),
    );
  }
}
