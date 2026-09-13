import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

const String kTelegramChannelUrl = 'https://t.me/+E2B_D_7AQIkyMjI1';

Future<void> openTelegram() async {
  final uri = Uri.parse(kTelegramChannelUrl);
  try {
    final launched = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );
    if (!launched) {
      await launchUrl(uri, mode: LaunchMode.platformDefault);
    }
  } catch (_) {
    try {
      await launchUrl(uri, mode: LaunchMode.platformDefault);
    } catch (_) {}
  }
}

/// Official Telegram Paper Plane Painter
class TelegramPaperPlanePainter extends CustomPainter {
  final Color color;

  TelegramPaperPlanePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final scaleX = size.width / 24.0;
    final scaleY = size.height / 24.0;

    final path = Path();
    path.moveTo(9.039 * scaleX, 13.568 * scaleY);
    path.lineTo(8.649 * scaleX, 19.075 * scaleY);
    path.cubicTo(9.209 * scaleX, 19.075 * scaleY, 9.453 * scaleX, 18.834 * scaleY, 9.741 * scaleX, 18.549 * scaleY);
    path.lineTo(12.361 * scaleX, 16.039 * scaleY);
    path.lineTo(17.794 * scaleX, 20.023 * scaleY);
    path.cubicTo(18.789 * scaleX, 20.576 * scaleY, 19.499 * scaleX, 20.287 * scaleY, 19.769 * scaleX, 19.101 * scaleY);
    path.lineTo(23.317 * scaleX, 2.467 * scaleY);
    path.cubicTo(23.631 * scaleX, 0.999 * scaleY, 22.782 * scaleX, 0.421 * scaleY, 21.814 * scaleX, 0.783 * scaleY);
    path.lineTo(1.758 * scaleX, 8.847 * scaleY);
    path.cubicTo(0.326 * scaleX, 9.4 * scaleY, 0.347 * scaleX, 10.212 * scaleY, 1.513 * scaleX, 10.575 * scaleY);
    path.lineTo(6.755 * scaleX, 12.211 * scaleY);
    path.lineTo(18.935 * scaleX, 4.526 * scaleY);
    path.cubicTo(19.508 * scaleX, 4.143 * scaleY, 20.031 * scaleX, 4.354 * scaleY, 19.601 * scaleX, 4.737 * scaleY);
    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant TelegramPaperPlanePainter oldDelegate) =>
      color != oldDelegate.color;
}

/// Official Telegram Circular Logo Badge
class TelegramCircleLogo extends StatelessWidget {
  final double size;

  const TelegramCircleLogo({super.key, this.size = 24});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: Color(0xFF229ED9),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: SizedBox(
          width: size * 0.58,
          height: size * 0.58,
          child: CustomPaint(
            painter: TelegramPaperPlanePainter(color: Colors.white),
          ),
        ),
      ),
    );
  }
}

/// Compact "Join Telegram" pill button designed for AppBars / Navbars
class TelegramButton extends StatelessWidget {
  final EdgeInsetsGeometry? padding;

  const TelegramButton({super.key, this.padding});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: InkWell(
        onTap: openTelegram,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: padding ?? const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
          decoration: BoxDecoration(
            color: const Color(0xFF229ED9).withOpacity(0.15),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: const Color(0xFF229ED9).withOpacity(0.45),
              width: 1,
            ),
          ),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              TelegramCircleLogo(size: 15),
              SizedBox(width: 5),
              Text(
                'Join Telegram',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF229ED9),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Clean single-line compact Telegram banner bar (with official Telegram logo)
class TelegramBannerCard extends StatelessWidget {
  final EdgeInsetsGeometry? margin;

  const TelegramBannerCard({super.key, this.margin});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF161E30) : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF229ED9).withOpacity(0.35),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: openTelegram,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            child: Row(
              children: [
                const TelegramCircleLogo(size: 26),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Join Our Official Telegram Channel',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.1,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF229ED9),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Join',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 11.5,
                        ),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.arrow_forward_ios_rounded, size: 9, color: Colors.white),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
