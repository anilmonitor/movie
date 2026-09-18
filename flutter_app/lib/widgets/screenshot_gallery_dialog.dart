import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'shimmer_loading.dart';

class ScreenshotGalleryDialog extends StatefulWidget {
  final List<String> images;
  final int initialIndex;

  const ScreenshotGalleryDialog({
    super.key,
    required this.images,
    this.initialIndex = 0,
  });

  static void show(BuildContext context, {required List<String> images, int initialIndex = 0}) {
    if (images.isEmpty) return;
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.94),
      barrierDismissible: true,
      builder: (_) => ScreenshotGalleryDialog(
        images: images,
        initialIndex: initialIndex,
      ),
    );
  }

  @override
  State<ScreenshotGalleryDialog> createState() => _ScreenshotGalleryDialogState();
}

class _ScreenshotGalleryDialogState extends State<ScreenshotGalleryDialog> {
  late final PageController _pageController;
  late int _currentIndex;
  bool _isZoomed = false;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex.clamp(0, widget.images.length - 1);
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _goToPrevious() {
    if (_currentIndex > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeInOut,
      );
    }
  }

  void _goToNext() {
    if (_currentIndex < widget.images.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 260),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = widget.images.length;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: EdgeInsets.zero,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background dismiss on tap
          Positioned.fill(
            child: GestureDetector(
              onTap: () {
                if (!_isZoomed) {
                  Navigator.pop(context);
                }
              },
              child: Container(color: Colors.transparent),
            ),
          ),

          // Main Content
          SafeArea(
            child: Column(
              children: [
                // Top Header Bar: Counter & Close Button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Counter badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.65),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.white24, width: 0.8),
                        ),
                        child: Text(
                          '${_currentIndex + 1} / $total',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),

                      // Close Button
                      Material(
                        color: Colors.black.withOpacity(0.65),
                        shape: const CircleBorder(),
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white24, width: 0.8),
                            ),
                            padding: const EdgeInsets.all(8),
                            child: const Icon(
                              Icons.close_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Interactive PageView with 2-finger zoom and double-tap zoom
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    physics: _isZoomed
                        ? const NeverScrollableScrollPhysics()
                        : const BouncingScrollPhysics(),
                    itemCount: total,
                    onPageChanged: (idx) {
                      setState(() {
                        _currentIndex = idx;
                        _isZoomed = false;
                      });
                    },
                    itemBuilder: (context, index) {
                      return _ZoomableScreenshotItem(
                        imageUrl: widget.images[index],
                        onZoomChanged: (zoomed) {
                          if (_isZoomed != zoomed) {
                            setState(() {
                              _isZoomed = zoomed;
                            });
                          }
                        },
                      );
                    },
                  ),
                ),

                // Bottom thumbnails bar (if more than 1 image)
                if (total > 1) ...[
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 54,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      shrinkWrap: true,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: total,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final isSelected = index == _currentIndex;
                        return GestureDetector(
                          onTap: () {
                            _pageController.animateToPage(
                              index,
                              duration: const Duration(milliseconds: 260),
                              curve: Curves.easeInOut,
                            );
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            width: 72,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isSelected ? Colors.redAccent : Colors.white24,
                                width: isSelected ? 2.5 : 1,
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(7),
                              child: CachedNetworkImage(
                                imageUrl: widget.images[index].contains('movies4u.kg')
                                    ? 'https://movieman4u.vercel.app/api/image-proxy?url=${Uri.encodeComponent(widget.images[index])}'
                                    : widget.images[index],
                                fit: BoxFit.cover,
                                httpHeaders: const {
                                  'User-Agent':
                                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                                  'Referer': 'https://movieman4u.vercel.app/',
                                },
                                errorWidget: (_, __, ___) => Container(color: Colors.white10),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ],
            ),
          ),

          // Left Navigation Button (Previous)
          if (total > 1 && _currentIndex > 0 && !_isZoomed)
            Positioned(
              left: 10,
              child: Material(
                color: Colors.black.withOpacity(0.65),
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: _goToPrevious,
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white24, width: 0.8),
                    ),
                    padding: const EdgeInsets.all(10),
                    child: const Icon(
                      Icons.chevron_left_rounded,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ),
              ),
            ),

          // Right Navigation Button (Next)
          if (total > 1 && _currentIndex < total - 1 && !_isZoomed)
            Positioned(
              right: 10,
              child: Material(
                color: Colors.black.withOpacity(0.65),
                shape: const CircleBorder(),
                child: InkWell(
                  customBorder: const CircleBorder(),
                  onTap: _goToNext,
                  child: Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white24, width: 0.8),
                    ),
                    padding: const EdgeInsets.all(10),
                    child: const Icon(
                      Icons.chevron_right_rounded,
                      color: Colors.white,
                      size: 32,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Zoomable Image with Smooth 2-Finger Pinch-to-Zoom & Double-Tap to Zoom In/Out
class _ZoomableScreenshotItem extends StatefulWidget {
  final String imageUrl;
  final ValueChanged<bool> onZoomChanged;

  const _ZoomableScreenshotItem({
    required this.imageUrl,
    required this.onZoomChanged,
  });

  @override
  State<_ZoomableScreenshotItem> createState() => _ZoomableScreenshotItemState();
}

class _ZoomableScreenshotItemState extends State<_ZoomableScreenshotItem>
    with SingleTickerProviderStateMixin {
  late final TransformationController _transformationController;
  late final AnimationController _animationController;
  Animation<Matrix4>? _animation;
  TapDownDetails? _doubleTapDetails;

  @override
  void initState() {
    super.initState();
    _transformationController = TransformationController();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 260),
    )..addListener(() {
        if (_animation != null) {
          _transformationController.value = _animation!.value;
        }
      });
  }

  @override
  void dispose() {
    _animationController.dispose();
    _transformationController.dispose();
    super.dispose();
  }

  void _handleDoubleTap() {
    final matrix = _transformationController.value;
    final currentScale = matrix.getMaxScaleOnAxis();

    Matrix4 targetMatrix;

    if (currentScale > 1.05) {
      // Zoom out to normal 1.0 scale
      targetMatrix = Matrix4.identity();
      widget.onZoomChanged(false);
    } else {
      // Zoom in to 2.5x around tapped position
      final position = _doubleTapDetails?.localPosition ?? Offset.zero;
      const targetScale = 2.5;
      final x = -position.dx * (targetScale - 1);
      final y = -position.dy * (targetScale - 1);

      targetMatrix = Matrix4.identity()
        ..translate(x, y)
        ..scale(targetScale);
      widget.onZoomChanged(true);
    }

    _animation = Matrix4Tween(
      begin: _transformationController.value,
      end: targetMatrix,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));

    _animationController.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onDoubleTapDown: (details) => _doubleTapDetails = details,
      onDoubleTap: _handleDoubleTap,
      child: InteractiveViewer(
        transformationController: _transformationController,
        panEnabled: true,
        scaleEnabled: true,
        minScale: 1.0,
        maxScale: 5.0,
        boundaryMargin: const EdgeInsets.all(120),
        clipBehavior: Clip.none,
        onInteractionUpdate: (_) {
          final scale = _transformationController.value.getMaxScaleOnAxis();
          widget.onZoomChanged(scale > 1.05);
        },
        onInteractionEnd: (_) {
          final scale = _transformationController.value.getMaxScaleOnAxis();
          widget.onZoomChanged(scale > 1.05);
        },
        child: Center(
          child: CachedNetworkImage(
            imageUrl: widget.imageUrl.contains('movies4u.kg')
                ? 'https://movieman4u.vercel.app/api/image-proxy?url=${Uri.encodeComponent(widget.imageUrl)}'
                : widget.imageUrl,
            fit: BoxFit.contain,
            httpHeaders: const {
              'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
              'Referer': 'https://movieman4u.vercel.app/',
            },
            placeholder: (_, __) => const Center(
              child: ShimmerBox(
                width: double.infinity,
                height: 260,
                borderRadius: 12,
              ),
            ),
            errorWidget: (_, __, ___) => const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.broken_image_rounded, color: Colors.white54, size: 48),
                  SizedBox(height: 8),
                  Text('Failed to load image', style: TextStyle(color: Colors.white54, fontSize: 12)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
