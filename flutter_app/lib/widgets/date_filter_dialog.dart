import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class DateFilterDialog extends StatefulWidget {
  final DateTime? initialStartDate;
  final DateTime? initialEndDate;

  const DateFilterDialog({
    super.key,
    this.initialStartDate,
    this.initialEndDate,
  });

  static Future<dynamic> show(
    BuildContext context, {
    DateTime? initialStartDate,
    DateTime? initialEndDate,
  }) {
    return showDialog<dynamic>(
      context: context,
      builder: (ctx) => DateFilterDialog(
        initialStartDate: initialStartDate,
        initialEndDate: initialEndDate,
      ),
    );
  }

  @override
  State<DateFilterDialog> createState() => _DateFilterDialogState();
}

class _DateFilterDialogState extends State<DateFilterDialog> {
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    _startDate = widget.initialStartDate;
    _endDate = widget.initialEndDate;
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return 'Select Date';
    return '${dt.day.toString().padLeft(2, '0')}/${dt.month.toString().padLeft(2, '0')}/${dt.year}';
  }

  Future<void> _pickSingleDate({required bool isStart}) async {
    final now = DateTime.now();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final picked = await showDatePicker(
      context: context,
      initialDate: isStart
          ? (_startDate ?? now)
          : (_endDate ?? now),
      firstDate: DateTime(2015),
      lastDate: DateTime(now.year + 2, 12, 31),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: isDark
                ? const ColorScheme.dark(
                    primary: AppTheme.primaryRed,
                    onPrimary: Colors.white,
                    surface: Color(0xFF161D2B),
                    onSurface: Colors.white,
                  )
                : const ColorScheme.light(
                    primary: AppTheme.primaryRed,
                    onPrimary: Colors.white,
                    surface: Colors.white,
                    onSurface: Colors.black87,
                  ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate != null && _endDate!.isBefore(picked)) {
            _endDate = picked;
          }
        } else {
          _endDate = picked;
          if (_startDate != null && _startDate!.isAfter(picked)) {
            _startDate = picked;
          }
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AlertDialog(
      backgroundColor: isDark ? AppTheme.darkCard : AppTheme.lightCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: isDark ? AppTheme.darkBorder : AppTheme.lightBorder),
      ),
      titlePadding: const EdgeInsets.fromLTRB(20, 18, 20, 12),
      title: Text(
        'Select Date',
        style: TextStyle(
          fontSize: 16.5,
          fontWeight: FontWeight.w700,
          color: isDark ? AppTheme.darkTextPrimary : AppTheme.lightTextPrimary,
        ),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Option 1: Start Date (From)
          Text(
            'From Date:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 6),
          InkWell(
            onTap: () => _pickSingleDate(isStart: true),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _startDate != null
                      ? AppTheme.primaryRed.withOpacity(0.6)
                      : (isDark ? Colors.white12 : Colors.grey.shade300),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.calendar_today_rounded,
                    size: 16,
                    color: _startDate != null ? AppTheme.primaryRed : Colors.grey,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    _formatDate(_startDate),
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: _startDate != null
                          ? (isDark ? Colors.white : Colors.black87)
                          : Colors.grey,
                    ),
                  ),
                  const Spacer(),
                  const Icon(Icons.arrow_drop_down_rounded, size: 20, color: Colors.grey),
                ],
              ),
            ),
          ),

          const SizedBox(height: 14),

          // Option 2: End Date (To)
          Text(
            'To Date:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: isDark ? AppTheme.darkTextSecondary : AppTheme.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 6),
          InkWell(
            onTap: () => _pickSingleDate(isStart: false),
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: _endDate != null
                      ? AppTheme.primaryRed.withOpacity(0.6)
                      : (isDark ? Colors.white12 : Colors.grey.shade300),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.event_available_rounded,
                    size: 16,
                    color: _endDate != null ? AppTheme.primaryRed : Colors.grey,
                  ),
                  const SizedBox(width: 10),
                  Text(
                    _formatDate(_endDate),
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: _endDate != null
                          ? (isDark ? Colors.white : Colors.black87)
                          : Colors.grey,
                    ),
                  ),
                  const Spacer(),
                  const Icon(Icons.arrow_drop_down_rounded, size: 20, color: Colors.grey),
                ],
              ),
            ),
          ),
        ],
      ),
      actionsPadding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
      actions: [
        if (widget.initialStartDate != null || widget.initialEndDate != null)
          TextButton(
            onPressed: () => Navigator.pop(context, 'RESET'),
            style: TextButton.styleFrom(
              foregroundColor: Colors.redAccent,
            ),
            child: const Text('Clear Filter', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        TextButton(
          onPressed: () => Navigator.pop(context),
          style: TextButton.styleFrom(
            foregroundColor: isDark ? Colors.grey[400] : Colors.grey[600],
          ),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_startDate != null || _endDate != null) {
              final start = _startDate ?? _endDate!;
              final end = _endDate ?? _startDate!;
              Navigator.pop(
                context,
                DateTimeRange(
                  start: start.isBefore(end) ? start : end,
                  end: end.isAfter(start) ? end : start,
                ),
              );
            } else {
              Navigator.pop(context);
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryRed,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          ),
          child: const Text('Apply', style: TextStyle(fontWeight: FontWeight.w700)),
        ),
      ],
    );
  }
}
