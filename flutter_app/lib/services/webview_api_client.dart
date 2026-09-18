import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/app_theme.dart';

class WebViewApiResponse {
  final int status;
  final int total;
  final int totalPages;
  final dynamic data;
  final String? error;

  WebViewApiResponse({
    required this.status,
    required this.total,
    required this.totalPages,
    this.data,
    this.error,
  });

  bool get isSuccess => status == 200 && data != null;
}

class WebViewApiClient {
  static final WebViewApiClient instance = WebViewApiClient._internal();
  WebViewApiClient._internal();

  static const String siteOrigin = 'https://movies4u.kg';
  static const String userAgent =
      'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

  WebViewController? _controller;
  bool _isInitializing = false;
  bool _isVerified = false;
  Completer<bool>? _readyCompleter;

  bool get isVerified => _isVerified;
  WebViewController? get controller => _controller;

  /// Initialize the WebView client
  Future<bool> ensureInitialized() async {
    if (_isVerified && _controller != null) return true;
    if (_isInitializing && _readyCompleter != null) {
      return _readyCompleter!.future;
    }

    _isInitializing = true;
    _readyCompleter = Completer<bool>();

    try {
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setUserAgent(userAgent)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (url) {},
            onPageFinished: (url) async {
              await _checkPageStatus();
            },
            onWebResourceError: (error) {},
          ),
        );

      await _controller!.loadRequest(Uri.parse(siteOrigin));

      // Wait up to 10 seconds for initial load / auto-pass
      Future.delayed(const Duration(seconds: 10), () {
        if (_readyCompleter != null && !_readyCompleter!.isCompleted) {
          _readyCompleter!.complete(_isVerified);
        }
      });

      return await _readyCompleter!.future;
    } catch (_) {
      _isInitializing = false;
      return false;
    }
  }

  Future<void> _checkPageStatus() async {
    if (_controller == null) return;
    try {
      final titleObj = await _controller!.runJavaScriptReturningResult('document.title');
      String title = _cleanJsString(titleObj.toString());

      // If title does not contain Cloudflare challenge markers, it's verified!
      final isChallenge = title.toLowerCase().contains('just a moment') ||
          title.toLowerCase().contains('cloudflare') ||
          title.toLowerCase().contains('attention required') ||
          title.isEmpty;

      if (!isChallenge) {
        _isVerified = true;
        _isInitializing = false;
        if (_readyCompleter != null && !_readyCompleter!.isCompleted) {
          _readyCompleter!.complete(true);
        }
      }
    } catch (_) {}
  }

  static String _cleanJsString(String raw) {
    var s = raw.trim();
    if (s.startsWith('"') && s.endsWith('"') && s.length >= 2) {
      try {
        final decoded = json.decode(s);
        if (decoded is String) return decoded;
      } catch (_) {
        return s.substring(1, s.length - 1);
      }
    }
    return s;
  }

  /// Execute a same-origin fetch from inside the verified WebView
  Future<WebViewApiResponse> fetch(String endpointWithQuery) async {
    final ready = await ensureInitialized();
    if (!ready || _controller == null) {
      return WebViewApiResponse(
        status: 403,
        total: 0,
        totalPages: 0,
        error: 'WebView not ready or blocked by Cloudflare',
      );
    }

    final jsCode = '''
      (async function() {
        try {
          const res = await fetch('$endpointWithQuery', {
            headers: {
              'Accept': 'application/json, text/plain, */*',
              'X-Requested-With': 'XMLHttpRequest'
            }
          });
          const total = parseInt(res.headers.get('x-wp-total') || '0', 10);
          const totalPages = parseInt(res.headers.get('x-wp-totalpages') || '1', 10);
          const text = await res.text();
          let jsonBody = null;
          try {
            jsonBody = JSON.parse(text);
          } catch(e) {
            jsonBody = null;
          }
          return JSON.stringify({
            status: res.status,
            total: total,
            totalPages: totalPages,
            data: jsonBody,
            rawText: jsonBody == null ? text.substring(0, 300) : null
          });
        } catch(err) {
          return JSON.stringify({
            status: 500,
            total: 0,
            totalPages: 0,
            error: err.toString()
          });
        }
      })();
    ''';

    try {
      final jsResult = await _controller!.runJavaScriptReturningResult(jsCode);
      final cleaned = _cleanJsString(jsResult.toString());
      final Map<String, dynamic> parsed = json.decode(cleaned);

      final status = parsed['status'] as int? ?? 500;
      final total = parsed['total'] as int? ?? 0;
      final totalPages = parsed['totalPages'] as int? ?? 0;
      final data = parsed['data'];
      final error = parsed['error'] as String?;

      if (status == 200 && data != null) {
        return WebViewApiResponse(
          status: status,
          total: total,
          totalPages: totalPages,
          data: data,
        );
      } else {
        return WebViewApiResponse(
          status: status,
          total: total,
          totalPages: totalPages,
          error: error ?? 'Invalid response',
        );
      }
    } catch (e) {
      return WebViewApiResponse(
        status: 500,
        total: 0,
        totalPages: 0,
        error: e.toString(),
      );
    }
  }

  /// Show verification dialog if manual Cloudflare click/checkbox is needed
  static Future<bool> showVerificationDialog(BuildContext context) async {
    final client = WebViewApiClient.instance;
    await client.ensureInitialized();

    if (client.isVerified) return true;
    if (!context.mounted) return client.isVerified;

    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F1422),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return _VerificationSheet(client: client);
      },
    );

    return result ?? client.isVerified;
  }
}

class _VerificationSheet extends StatefulWidget {
  final WebViewApiClient client;
  const _VerificationSheet({required this.client});

  @override
  State<_VerificationSheet> createState() => _VerificationSheetState();
}

class _VerificationSheetState extends State<_VerificationSheet> {
  bool _checking = false;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    // Poll title every 1.5 seconds to auto-dismiss when verified
    _pollTimer = Timer.periodic(const Duration(milliseconds: 1500), (_) async {
      if (!mounted) return;
      await widget.client._checkPageStatus();
      if (widget.client.isVerified && mounted) {
        _pollTimer?.cancel();
        Navigator.of(context).pop(true);
      }
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = widget.client.controller;

    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryRed.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.security_rounded, color: AppTheme.primaryRed, size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Security Verification',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Complete verification below to load movies',
                      style: TextStyle(color: Colors.white60, fontSize: 12),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: Colors.white54),
                onPressed: () => Navigator.of(context).pop(false),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: controller != null
                  ? WebViewWidget(controller: controller)
                  : const Center(
                      child: CircularProgressIndicator(color: AppTheme.primaryRed),
                    ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                setState(() => _checking = true);
                await widget.client._checkPageStatus();
                setState(() => _checking = false);
                if (widget.client.isVerified && context.mounted) {
                  Navigator.of(context).pop(true);
                }
              },
              icon: _checking
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.check_circle_outline_rounded, size: 18),
              label: Text(_checking ? 'Checking...' : 'I have verified / Continue'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryRed,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
