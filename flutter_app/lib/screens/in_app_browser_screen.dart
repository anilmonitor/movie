import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/app_theme.dart';

class InAppBrowserScreen extends StatefulWidget {
  final String url;
  final String title;

  const InAppBrowserScreen({
    super.key,
    required this.url,
    required this.title,
  });

  static Future<void> open(BuildContext context, {required String url, required String title}) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => InAppBrowserScreen(url: url, title: title),
      ),
    );
  }

  @override
  State<InAppBrowserScreen> createState() => _InAppBrowserScreenState();
}

class _InAppBrowserScreenState extends State<InAppBrowserScreen> with SingleTickerProviderStateMixin {
  late final WebViewController _controller;
  late final TextEditingController _urlTextController;
  late final FocusNode _urlFocusNode;

  int _loadingProgress = 0;
  bool _isLoading = true;
  String _currentUrl = '';
  bool _canGoBack = false;
  bool _canGoForward = false;
  bool _isEditingUrl = false;

  // Pull down to refresh gesture state
  double _scrollY = 0.0;
  double _pullDistance = 0.0;
  bool _isPulling = false;
  bool _isRefreshing = false;
  late final AnimationController _spinController;

  static const double _refreshThreshold = 75.0;

  @override
  void initState() {
    super.initState();
    _currentUrl = widget.url;
    _urlTextController = TextEditingController(text: widget.url);
    _urlFocusNode = FocusNode();

    _urlFocusNode.addListener(() {
      if (mounted) {
        setState(() {
          _isEditingUrl = _urlFocusNode.hasFocus;
          if (_urlFocusNode.hasFocus) {
            _urlTextController.text = _currentUrl;
            _urlTextController.selection = TextSelection(
              baseOffset: 0,
              extentOffset: _urlTextController.text.length,
            );
          }
        });
      }
    });

    _spinController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _initWebViewController();
  }

  void _initWebViewController() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setUserAgent(
        'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      )
      ..setOnScrollPositionChange((ScrollPositionChange change) {
        _scrollY = change.y;
      })
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (mounted) {
              setState(() {
                _loadingProgress = progress;
                _isLoading = progress < 100;
              });
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                _currentUrl = url;
                _isLoading = true;
                if (!_isEditingUrl) {
                  _urlTextController.text = url;
                }
              });
              _updateNavState();
              _injectScripts();
            }
          },
          onPageFinished: (String url) async {
            if (mounted) {
              setState(() {
                _currentUrl = url;
                _isLoading = false;
                _isRefreshing = false;
                _pullDistance = 0.0;
                _spinController.stop();
                if (!_isEditingUrl) {
                  _urlTextController.text = url;
                }
              });
              _updateNavState();
              _injectScripts();
            }
          },
          onWebResourceError: (WebResourceError error) {
            if (mounted && _isRefreshing) {
              setState(() {
                _isRefreshing = false;
                _pullDistance = 0.0;
                _spinController.stop();
              });
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            final uri = Uri.tryParse(request.url);
            if (uri != null) {
              final scheme = uri.scheme.toLowerCase();
              if (scheme == 'http' || scheme == 'https') {
                return NavigationDecision.navigate;
              }
              // External schemes like tel:, mailto:, intent:, market:
              try {
                launchUrl(uri, mode: LaunchMode.externalApplication);
              } catch (_) {}
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      );

    _controller.loadRequest(Uri.parse(widget.url));
  }

  /// Injects script to ensure all window.open and target="_blank" links
  /// open in the same window, preserving the back stack history.
  void _injectScripts() {
    _controller.runJavaScript('''
      (function() {
        // Intercept window.open to load within the same webview
        var origOpen = window.open;
        window.open = function(url, target, features) {
          if (url && typeof url === 'string') {
            window.location.href = url;
            return window;
          }
          return origOpen ? origOpen.apply(this, arguments) : window;
        };

        // Intercept link clicks with target="_blank"
        document.addEventListener('click', function(e) {
          var el = e.target;
          while (el && el.tagName !== 'A') {
            el = el.parentElement;
          }
          if (el && el.tagName === 'A') {
            if (el.getAttribute('target') === '_blank') {
              el.setAttribute('target', '_self');
            }
          }
        }, true);
      })();
    ''').catchError((_) {});
  }

  Future<void> _updateNavState() async {
    final canBack = await _controller.canGoBack();
    final canFwd = await _controller.canGoForward();
    if (mounted) {
      setState(() {
        _canGoBack = canBack;
        _canGoForward = canFwd;
      });
    }
  }

  Future<void> _handleRefresh() async {
    setState(() {
      _isRefreshing = true;
      _spinController.repeat();
    });
    await _controller.reload();
  }

  void _navigateToUrl(String input) {
    String formatted = input.trim();
    if (formatted.isEmpty) return;

    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      if (!formatted.contains('.') || formatted.contains(' ')) {
        formatted = 'https://www.google.com/search?q=${Uri.encodeComponent(formatted)}';
      } else {
        formatted = 'https://$formatted';
      }
    }

    _urlFocusNode.unfocus();
    _controller.loadRequest(Uri.parse(formatted));
  }

  @override
  void dispose() {
    _urlTextController.dispose();
    _urlFocusNode.dispose();
    _spinController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;

        // If URL bar has focus, unfocus first
        if (_urlFocusNode.hasFocus) {
          _urlFocusNode.unfocus();
          return;
        }

        // If webview can navigate backwards, go to previous page
        if (await _controller.canGoBack()) {
          await _controller.goBack();
          await _updateNavState();
          return;
        }

        // If at the beginning of history, pop the screen
        if (context.mounted) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF090D16),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0F1422),
          elevation: 0,
          leadingWidth: 44,
          leading: IconButton(
            icon: const Icon(Icons.close_rounded, color: Colors.white, size: 22),
            tooltip: 'Close',
            onPressed: () => Navigator.of(context).pop(),
          ),
          titleSpacing: 0,
          title: Container(
            height: 40,
            margin: const EdgeInsets.only(right: 6),
            padding: const EdgeInsets.symmetric(horizontal: 10),
            decoration: BoxDecoration(
              color: const Color(0xFF182032),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _isEditingUrl
                    ? AppTheme.primaryRed.withOpacity(0.8)
                    : Colors.white.withOpacity(0.1),
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  _currentUrl.startsWith('https://')
                      ? Icons.lock_rounded
                      : Icons.public_rounded,
                  size: 14,
                  color: _currentUrl.startsWith('https://')
                      ? Colors.greenAccent
                      : Colors.white54,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _urlTextController,
                    focusNode: _urlFocusNode,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.white,
                      fontWeight: FontWeight.w500,
                    ),
                    keyboardType: TextInputType.url,
                    textInputAction: TextInputAction.go,
                    onSubmitted: _navigateToUrl,
                    decoration: const InputDecoration(
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(vertical: 8),
                      border: InputBorder.none,
                      hintText: 'Search or enter website name...',
                      hintStyle: TextStyle(fontSize: 13, color: Colors.white38),
                    ),
                  ),
                ),
                if (_isEditingUrl && _urlTextController.text.isNotEmpty)
                  GestureDetector(
                    onTap: () {
                      _urlTextController.clear();
                      setState(() {});
                    },
                    child: const Padding(
                      padding: EdgeInsets.only(left: 4, right: 4),
                      child: Icon(Icons.cancel_rounded, size: 16, color: Colors.white54),
                    ),
                  ),
                if (_isEditingUrl)
                  GestureDetector(
                    onTap: () => _navigateToUrl(_urlTextController.text),
                    child: Container(
                      margin: const EdgeInsets.only(left: 2),
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppTheme.primaryRed,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.arrow_forward_rounded, size: 12, color: Colors.white),
                    ),
                  ),
              ],
            ),
          ),
          actions: [
            IconButton(
              icon: Icon(
                _isLoading ? Icons.close_rounded : Icons.refresh_rounded,
                color: Colors.white70,
                size: 20,
              ),
              tooltip: _isLoading ? 'Stop' : 'Reload',
              onPressed: () {
                if (_isLoading) {
                  _controller.loadRequest(Uri.parse(_currentUrl));
                } else {
                  _handleRefresh();
                }
              },
            ),
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert_rounded, color: Colors.white70, size: 20),
              color: const Color(0xFF182032),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              onSelected: (val) async {
                if (val == 'copy') {
                  await Clipboard.setData(ClipboardData(text: _currentUrl));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('URL copied to clipboard'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  }
                } else if (val == 'external') {
                  final uri = Uri.tryParse(_currentUrl);
                  if (uri != null) {
                    launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                } else if (val == 'reload') {
                  _handleRefresh();
                }
              },
              itemBuilder: (ctx) => [
                const PopupMenuItem(
                  value: 'reload',
                  child: Row(
                    children: [
                      Icon(Icons.refresh_rounded, size: 16, color: Colors.white70),
                      SizedBox(width: 10),
                      Text('Reload', style: TextStyle(color: Colors.white, fontSize: 13)),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'copy',
                  child: Row(
                    children: [
                      Icon(Icons.copy_rounded, size: 16, color: Colors.white70),
                      SizedBox(width: 10),
                      Text('Copy URL', style: TextStyle(color: Colors.white, fontSize: 13)),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'external',
                  child: Row(
                    children: [
                      Icon(Icons.open_in_browser_rounded, size: 16, color: Colors.white70),
                      SizedBox(width: 10),
                      Text('Open in Chrome', style: TextStyle(color: Colors.white, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
          ],
          bottom: _isLoading
              ? PreferredSize(
                  preferredSize: const Size.fromHeight(2.5),
                  child: LinearProgressIndicator(
                    value: _loadingProgress / 100.0,
                    backgroundColor: Colors.transparent,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primaryRed),
                    minHeight: 2.5,
                  ),
                )
              : null,
        ),
        body: Stack(
          children: [
            // Raw pointer listener catches pull-to-refresh even on PlatformView
            Listener(
              onPointerDown: (event) {
                if (_scrollY <= 0) {
                  _isPulling = true;
                }
              },
              onPointerMove: (event) {
                if (_isPulling && _scrollY <= 0 && event.delta.dy > 0) {
                  setState(() {
                    _pullDistance = math.min(_pullDistance + event.delta.dy * 0.45, 110.0);
                  });
                } else if (_isPulling && event.delta.dy < 0 && _pullDistance > 0) {
                  setState(() {
                    _pullDistance = math.max(0.0, _pullDistance + event.delta.dy * 0.45);
                  });
                }
              },
              onPointerUp: (event) {
                if (_isPulling) {
                  _isPulling = false;
                  if (_pullDistance >= _refreshThreshold && !_isRefreshing) {
                    _handleRefresh();
                  } else {
                    setState(() {
                      _pullDistance = 0.0;
                    });
                  }
                }
              },
              onPointerCancel: (event) {
                _isPulling = false;
                setState(() {
                  _pullDistance = 0.0;
                });
              },
              child: WebViewWidget(controller: _controller),
            ),

            // Sleek animated pull-down refresh indicator
            if (_pullDistance > 10 || _isRefreshing)
              Positioned(
                top: _isRefreshing ? 16 : (_pullDistance * 0.6) - 10,
                left: 0,
                right: 0,
                child: Center(
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFF182032),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.35),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                      border: Border.all(
                        color: _pullDistance >= _refreshThreshold || _isRefreshing
                            ? AppTheme.primaryRed
                            : Colors.white24,
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: _isRefreshing
                          ? RotationTransition(
                              turns: _spinController,
                              child: const Icon(
                                Icons.refresh_rounded,
                                size: 18,
                                color: AppTheme.primaryRed,
                              ),
                            )
                          : Transform.rotate(
                              angle: (_pullDistance / _refreshThreshold) * math.pi * 2,
                              child: Icon(
                                Icons.arrow_downward_rounded,
                                size: 18,
                                color: _pullDistance >= _refreshThreshold
                                    ? AppTheme.primaryRed
                                    : Colors.white70,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: const Color(0xFF0F1422),
            border: Border(top: BorderSide(color: Colors.white.withOpacity(0.08))),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
          child: SafeArea(
            top: false,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Back Button
                IconButton(
                  icon: Icon(
                    Icons.arrow_back_ios_new_rounded,
                    size: 20,
                    color: _canGoBack ? Colors.white : Colors.white24,
                  ),
                  tooltip: 'Go Back (Previous Page)',
                  onPressed: _canGoBack
                      ? () async {
                          await _controller.goBack();
                          await _updateNavState();
                        }
                      : null,
                ),

                // Forward Button
                IconButton(
                  icon: Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 20,
                    color: _canGoForward ? Colors.white : Colors.white24,
                  ),
                  tooltip: 'Go Forward',
                  onPressed: _canGoForward
                      ? () async {
                          await _controller.goForward();
                          await _updateNavState();
                        }
                      : null,
                ),

                // Refresh Button
                IconButton(
                  icon: const Icon(
                    Icons.refresh_rounded,
                    size: 22,
                    color: Colors.white70,
                  ),
                  tooltip: 'Refresh',
                  onPressed: _handleRefresh,
                ),

                // Open in External Browser
                IconButton(
                  icon: const Icon(
                    Icons.open_in_browser_rounded,
                    size: 22,
                    color: Colors.white70,
                  ),
                  tooltip: 'Open in Chrome',
                  onPressed: () {
                    final uri = Uri.tryParse(_currentUrl);
                    if (uri != null) {
                      launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                ),

                // Close / Done Button
                IconButton(
                  icon: const Icon(
                    Icons.check_circle_rounded,
                    size: 22,
                    color: AppTheme.primaryRed,
                  ),
                  tooltip: 'Done',
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
