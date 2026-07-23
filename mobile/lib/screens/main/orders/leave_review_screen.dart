import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class LeaveReviewScreen extends StatefulWidget {
  final String orderId;
  const LeaveReviewScreen({super.key, required this.orderId});

  @override
  State<LeaveReviewScreen> createState() => _LeaveReviewScreenState();
}

class _LeaveReviewScreenState extends State<LeaveReviewScreen> {
  final _formKey = GlobalKey<FormState>();
  final _pageController = PageController();
  int _activeStep = 0;

  String? _shopId;
  String _shopName = 'Shop';
  bool _loading = true;
  bool _submitting = false;

  int _quality = 0;
  int _delivery = 0;
  int _accuracy = 0;
  int _overall = 0;

  final _qualityDescController = TextEditingController();
  final _deliveryDescController = TextEditingController();
  final _accuracyDescController = TextEditingController();
  final _overallDescController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadOrderDetails();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _qualityDescController.dispose();
    _deliveryDescController.dispose();
    _accuracyDescController.dispose();
    _overallDescController.dispose();
    super.dispose();
  }

  Future<void> _loadOrderDetails() async {
    try {
      final res = await supabase
          .from('orders')
          .select('status, shop_id, shops(name)')
          .eq('id', widget.orderId)
          .single();

      final status = res['status'] as String?;
      if (status != 'delivered') {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('You can only review delivered orders')),
          );
          Navigator.of(context).pop();
        }
        return;
      }

      // Check if already reviewed
      final existingReview = await supabase
          .from('shop_reviews')
          .select('id')
          .eq('order_id', widget.orderId)
          .maybeSingle();

      if (existingReview != null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('This order has already been reviewed')),
          );
          Navigator.of(context).pop();
        }
        return;
      }

      if (mounted) {
        setState(() {
          _shopId = res['shop_id'] as String;
          _shopName = (res['shops'] as Map?)?['name'] as String? ?? 'Shop';
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.failedToLoadOrderDetails(e.toString()))),
        );
        Navigator.of(context).pop();
      }
    }
  }

  Future<void> _submitReview() async {
    if (_shopId == null) return;
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('User not authenticated');

      final finalRating = (_quality + _delivery + _accuracy + _overall) / 4.0;

      await supabase.from('shop_reviews').insert({
        'shop_id': _shopId,
        'user_id': userId,
        'order_id': widget.orderId,
        'product_quality_rating': _quality,
        'delivery_experience_rating': _delivery,
        'delivery_timeliness_rating': _delivery,
        'order_accuracy_rating': _accuracy,
        'overall_experience_rating': _overall,
        'product_quality_description': _qualityDescController.text.trim().isEmpty ? null : _qualityDescController.text.trim(),
        'product_quality_review': _qualityDescController.text.trim().isEmpty ? null : _qualityDescController.text.trim(),
        'delivery_experience_description': _deliveryDescController.text.trim().isEmpty ? null : _deliveryDescController.text.trim(),
        'delivery_timeliness_review': _deliveryDescController.text.trim().isEmpty ? null : _deliveryDescController.text.trim(),
        'order_accuracy_description': _accuracyDescController.text.trim().isEmpty ? null : _accuracyDescController.text.trim(),
        'order_accuracy_review': _accuracyDescController.text.trim().isEmpty ? null : _accuracyDescController.text.trim(),
        'overall_experience_description': _overallDescController.text.trim().isEmpty ? null : _overallDescController.text.trim(),
        'overall_experience_review': _overallDescController.text.trim().isEmpty ? null : _overallDescController.text.trim(),
        'final_rating': finalRating,
        'title': null,
        'review': null,
      });

      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.reviewSubmittedSuccess),
            backgroundColor: kSuccess,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.reviewSubmittedFailed(e.toString())),
            backgroundColor: kDanger,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Map<String, dynamic>? _getSentiment(int rating) {
    if (rating == 0) return null;
    switch (rating) {
      case 1:
        return {'label': 'Poor', 'emoji': '😞', 'color': Colors.redAccent};
      case 2:
        return {'label': 'Fair', 'emoji': '😐', 'color': Colors.orangeAccent};
      case 3:
        return {'label': 'Good', 'emoji': '🙂', 'color': Colors.amber};
      case 4:
        return {'label': 'Very Good', 'emoji': '😊', 'color': Colors.lightGreen};
      case 5:
        return {'label': 'Excellent', 'emoji': '🤩', 'color': Colors.green};
      default:
        return null;
    }
  }

  Widget _buildStepRating({
    required int stepIndex,
    required String label,
    required String subtitle,
    required int currentValue,
    required ValueChanged<int> onChanged,
    required TextEditingController controller,
    required String placeholder,
  }) {
    final isDark = ThemeService.instance.isDarkMode;
    final kCardBg = isDark ? kNeutral800 : Colors.white;
    final kBorder = isDark ? kNeutral700 : kNeutral200;
    final textBase = isDark ? Colors.white : kNeutral900;
    final textMuted = isDark ? kNeutral400 : kNeutral600;  
    final sentiment = _getSentiment(currentValue);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Step ${stepIndex + 1} of 5: $label',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: textMuted,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: textBase,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 14,
              color: textMuted,
            ),
          ),
          const SizedBox(height: 32),

          // Stars selection block
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              final starVal = index + 1;
              final isSel = starVal <= currentValue;
              return TweenAnimationBuilder<double>(
                duration: const Duration(milliseconds: 150),
                tween: Tween(begin: 1.0, end: isSel ? 1.15 : 1.0),
                builder: (context, scale, child) {
                  return Transform.scale(
                    scale: scale,
                    child: IconButton(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      constraints: const BoxConstraints(),
                      icon: Icon(
                        isSel ? Icons.star_rounded : Icons.star_outline_rounded,
                        color: isSel ? const Color(0xFFF59E0B) : kNeutral400,
                        size: 42,
                      ),
                      onPressed: () => onChanged(starVal),
                    ),
                  );
                },
              );
            }),
          ),
          const SizedBox(height: 16),

          // Sentiment Badge
          if (sentiment != null)
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: (sentiment['color'] as Color).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(sentiment['emoji'] as String, style: const TextStyle(fontSize: 18)),
                    const SizedBox(width: 8),
                    Text(
                      sentiment['label'] as String,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: sentiment['color'] as Color,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 32),

          Text(
            'Write a comment (Optional)',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: textBase,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: kCardBg,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
            ),
            child: TextFormField(
              controller: controller,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: placeholder,
                hintStyle: const TextStyle(fontSize: 13, color: kNeutral500),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(16),
              ),
              style: TextStyle(fontSize: 14, color: textBase),
            ),
          ),
          const SizedBox(height: 32),

          // Navigation buttons
          Row(
            children: [
              if (stepIndex > 0)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      _pageController.previousPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: kWaGreen,
                      side: BorderSide(color: kBorder),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text('Back', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                )
              else
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: kNeutral500,
                      side: BorderSide(color: kBorder),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: currentValue > 0
                      ? () {
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        }
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kWaGreen,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: kBorder,
                    disabledForegroundColor: kNeutral500,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('Continue', style: TextStyle(fontWeight: FontWeight.bold)),
                      SizedBox(width: 8),
                      Icon(Icons.arrow_forward_rounded, size: 16),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryStep() {
    final isDark = ThemeService.instance.isDarkMode;
    final kCardBg = isDark ? kNeutral800 : Colors.white;
    final kBorder = isDark ? kNeutral700 : kNeutral200;
    final textBase = isDark ? Colors.white : kNeutral900;
    final textMuted = isDark ? kNeutral400 : kNeutral600;  
    final double avg = (_quality + _delivery + _accuracy + _overall) / 4.0;
    final l10n = AppLocalizations.of(context)!;

    final categories = [
      {'label': l10n.productQualityRatingLabel, 'val': _quality, 'cmt': _qualityDescController.text.trim()},
      {'label': l10n.deliveryTimelinessRatingLabel, 'val': _delivery, 'cmt': _deliveryDescController.text.trim()},
      {'label': l10n.orderAccuracyRatingLabel, 'val': _accuracy, 'cmt': _accuracyDescController.text.trim()},
      {'label': l10n.overallExperienceRatingLabel, 'val': _overall, 'cmt': _overallDescController.text.trim()},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Step 5 of 5: Summary',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: textMuted,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Review Summary',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: textBase,
            ),
          ),
          const SizedBox(height: 24),

          // Ring layout of Average Rating
          Center(
            child: Container(
              width: 130,
              height: 130,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: kCardBg,
                border: Border.all(color: kBorder, width: 4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      avg.toStringAsFixed(2),
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w900,
                        color: kWaGreen,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Avg Score',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Categories Breakdown List
          ...categories.map((c) {
            final ratingVal = c['val'] as int;
            final sentiment = _getSentiment(ratingVal);
            final comment = c['cmt'] as String;

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: kCardBg,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: kBorder),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c['label'] as String,
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textBase),
                        ),
                        if (comment.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            '"$comment"',
                            style: TextStyle(fontSize: 12, color: textMuted, fontStyle: FontStyle.italic),
                          ),
                        ]
                      ],
                    ),
                  ),
                  if (sentiment != null) ...[
                    Text('${sentiment['emoji']} ', style: const TextStyle(fontSize: 16)),
                    Text(
                      '$ratingVal ★',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: sentiment['color'] as Color),
                    ),
                  ],
                ],
              ),
            );
          }),
          const SizedBox(height: 24),

          // Navigation buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    _pageController.previousPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: kNeutral500,
                    side: BorderSide(color: kBorder),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text('Edit Ratings', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submitReview,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kWaGreen,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: _submitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(l10n.submitReviewButton, style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: Text(l10n.reviewShopTitle(_shopName)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(4),
          child: AnimatedBuilder(
            animation: _pageController,
            builder: (context, _) {
              double page = 0.0;
              if (_pageController.hasClients) {
                page = _pageController.page ?? 0.0;
              } else {
                page = _activeStep.toDouble();
              }
              return LinearProgressIndicator(
                value: (page + 1) / 5.0,
                backgroundColor: isDark ? kNeutral700 : kNeutral200,
                valueColor: AlwaysStoppedAnimation<Color>(kWaGreen),
              );
            },
          ),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (val) {
                  setState(() {
                    _activeStep = val;
                  });
                },
                children: [
                  _buildStepRating(
                    stepIndex: 0,
                    label: l10n.productQualityRatingLabel,
                    subtitle: l10n.productQualityRatingSub,
                    currentValue: _quality,
                    onChanged: (val) => setState(() => _quality = val),
                    controller: _qualityDescController,
                    placeholder: l10n.productQualityRatingHint,
                  ),
                  _buildStepRating(
                    stepIndex: 1,
                    label: l10n.deliveryTimelinessRatingLabel,
                    subtitle: l10n.deliveryTimelinessRatingSub,
                    currentValue: _delivery,
                    onChanged: (val) => setState(() => _delivery = val),
                    controller: _deliveryDescController,
                    placeholder: l10n.deliveryTimelinessRatingHint,
                  ),
                  _buildStepRating(
                    stepIndex: 2,
                    label: l10n.orderAccuracyRatingLabel,
                    subtitle: l10n.orderAccuracyRatingSub,
                    currentValue: _accuracy,
                    onChanged: (val) => setState(() => _accuracy = val),
                    controller: _accuracyDescController,
                    placeholder: l10n.orderAccuracyRatingHint,
                  ),
                  _buildStepRating(
                    stepIndex: 3,
                    label: l10n.overallExperienceRatingLabel,
                    subtitle: l10n.overallExperienceRatingSub,
                    currentValue: _overall,
                    onChanged: (val) => setState(() => _overall = val),
                    controller: _overallDescController,
                    placeholder: l10n.overallExperienceRatingHint,
                  ),
                  _buildSummaryStep(),
                ],
              ),
            ),
    );
  }
}
