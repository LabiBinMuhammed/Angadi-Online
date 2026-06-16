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

  String? _shopId;
  String _shopName = 'Shop';
  bool _loading = true;
  bool _submitting = false;

  int _quality = 5;
  int _delivery = 5;
  int _accuracy = 5;
  int _overall = 5;

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
          .select('shop_id, shops(name)')
          .eq('id', widget.orderId)
          .single();

      if (mounted) {
        setState(() {
          _shopId = res['shop_id'] as String;
          _shopName = (res['shops'] as Map)['name'] as String? ?? 'Shop';
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

  Widget _buildRatingSelector({
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

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : kNeutral900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: kNeutral500,
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (index) {
                  final starVal = index + 1;
                  return IconButton(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    constraints: const BoxConstraints(),
                    icon: Icon(
                      starVal <= currentValue ? Icons.star_rounded : Icons.star_outline_rounded,
                      color: const Color(0xFFF59E0B),
                      size: 28,
                    ),
                    onPressed: () => onChanged(starVal),
                  );
                }),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: controller,
            maxLines: null,
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: const TextStyle(fontSize: 13, color: kNeutral500),
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: kBorder),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: kBorder),
              ),
            ),
            style: TextStyle(fontSize: 14, color: isDark ? Colors.white : kNeutral900),
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
        title: Text(AppLocalizations.of(context)!.reviewShopTitle(_shopName)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      AppLocalizations.of(context)!.rateYourExperienceTitle,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : kNeutral900,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      AppLocalizations.of(context)!.rateExperienceSubtitle(_shopName),
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark ? kNeutral400 : kNeutral600,
                      ),
                    ),
                    const SizedBox(height: 24),

                    _buildRatingSelector(
                      label: AppLocalizations.of(context)!.productQualityRatingLabel,
                      subtitle: AppLocalizations.of(context)!.productQualityRatingSub,
                      currentValue: _quality,
                      onChanged: (val) => setState(() => _quality = val),
                      controller: _qualityDescController,
                      placeholder: AppLocalizations.of(context)!.productQualityRatingHint,
                    ),
                    _buildRatingSelector(
                      label: AppLocalizations.of(context)!.deliveryTimelinessRatingLabel,
                      subtitle: AppLocalizations.of(context)!.deliveryTimelinessRatingSub,
                      currentValue: _delivery,
                      onChanged: (val) => setState(() => _delivery = val),
                      controller: _deliveryDescController,
                      placeholder: AppLocalizations.of(context)!.deliveryTimelinessRatingHint,
                    ),
                    _buildRatingSelector(
                      label: AppLocalizations.of(context)!.orderAccuracyRatingLabel,
                      subtitle: AppLocalizations.of(context)!.orderAccuracyRatingSub,
                      currentValue: _accuracy,
                      onChanged: (val) => setState(() => _accuracy = val),
                      controller: _accuracyDescController,
                      placeholder: AppLocalizations.of(context)!.orderAccuracyRatingHint,
                    ),
                    _buildRatingSelector(
                      label: AppLocalizations.of(context)!.overallExperienceRatingLabel,
                      subtitle: AppLocalizations.of(context)!.overallExperienceRatingSub,
                      currentValue: _overall,
                      onChanged: (val) => setState(() => _overall = val),
                      controller: _overallDescController,
                      placeholder: AppLocalizations.of(context)!.overallExperienceRatingHint,
                    ),
                    const SizedBox(height: 12),

                    // Summary average card
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      decoration: BoxDecoration(
                        color: isDark ? kNeutral800 : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            AppLocalizations.of(context)!.calculatedAverageLabel,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : kNeutral900,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: kWaGreenDark.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              ((_quality + _delivery + _accuracy + _overall) / 4.0).toStringAsFixed(2),
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: kWaGreenDark,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Submit button
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _submitting ? null : _submitReview,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kWaGreenDark,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                        child: _submitting
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(
                                l10n.submitReviewButton,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
