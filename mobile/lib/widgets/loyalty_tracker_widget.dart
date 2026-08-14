import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:village_market/services/loyalty_service.dart';
import 'package:village_market/widgets/scratch_card_dialog.dart';

class LoyaltyTrackerWidget extends StatefulWidget {
  final double? orderAmount;
  final String? orderStatus;
  final String? orderId;

  const LoyaltyTrackerWidget({
    super.key,
    this.orderAmount,
    this.orderStatus,
    this.orderId,
  });

  @override
  State<LoyaltyTrackerWidget> createState() => _LoyaltyTrackerWidgetState();
}

class _LoyaltyTrackerWidgetState extends State<LoyaltyTrackerWidget> {
  LoyaltyData _loyalty = LoyaltyData(starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0.0);
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLoyalty();
  }

  @override
  void didUpdateWidget(covariant LoyaltyTrackerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.orderId != oldWidget.orderId || widget.orderStatus != oldWidget.orderStatus) {
      _fetchLoyalty();
    }
  }

  Future<void> _fetchLoyalty() async {
    if (widget.orderId != null && widget.orderStatus == 'delivered') {
      final res = await LoyaltyService.awardOrderStarIfEligible(widget.orderId!);
      if (res['starsCount'] != null) {
        if (mounted) {
          setState(() {
            _loyalty = LoyaltyData(
              starsCount: res['starsCount'],
              scratchCardsUnlocked: res['unlockedScratchCard'] == true ? 1 : 0,
              totalCreditEarned: 0.0,
            );
            _isLoading = false;
          });
          return;
        }
      }
    }

    final data = await LoyaltyService.getUserLoyalty();
    if (mounted) {
      setState(() {
        _loyalty = data;
        _isLoading = false;
      });
    }
  }

  void _openScratchCard() {
    showDialog(
      context: context,
      builder: (ctx) => ScratchCardDialog(
        onClaimed: () {
          _fetchLoyalty();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isUnlocked = _loyalty.starsCount >= 5 || _loyalty.scratchCardsUnlocked > 0;
    final isOrderEligible = (widget.orderAmount ?? 0) >= 0.0;

    if (_isLoading) {
      return const SizedBox.shrink();
    }

    final cardBg = isDark
        ? const LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          )
        : const LinearGradient(
            colors: [Colors.white, Color(0xFFF8FAFC)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          );

    final titleColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final subColor = isDark ? Colors.white70 : const Color(0xFF64748B);
    final borderTileColor = isDark ? Colors.white12 : const Color(0xFFE2E8F0);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: cardBg,
        boxShadow: [
          BoxShadow(
            color: isDark
                ? const Color(0xFF0F172A).withValues(alpha: 0.3)
                : const Color(0xFF64748B).withValues(alpha: 0.06),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: borderTileColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Sleek Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      gradient: const LinearGradient(
                        colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.star_rounded, size: 20, color: Colors.white),
                  ),
                  const SizedBox(width: 8),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n?.loyaltyClubTitle ?? '5-Star Rewards Club ⭐',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: titleColor,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        l10n?.loyaltyProgressLabel('${_loyalty.starsCount.clamp(0, 5)}') ??
                            '${_loyalty.starsCount.clamp(0, 5)} / 5 Stars Collected',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: subColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              if (isUnlocked)
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  ),
                  onPressed: _openScratchCard,
                  child: Text(
                    l10n?.loyaltyScratchNowBtn ?? 'Scratch Now 🎟️',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800),
                  ),
                ),
            ],
          ),

          if (widget.orderAmount != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isOrderEligible
                    ? const Color(0xFF22C55E).withValues(alpha: 0.1)
                    : (isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF1F5F9)),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isOrderEligible
                      ? const Color(0xFF22C55E).withValues(alpha: 0.25)
                      : borderTileColor,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.auto_awesome_rounded,
                    size: 14,
                    color: isOrderEligible ? const Color(0xFF22C55E) : const Color(0xFFF59E0B),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      l10n?.loyaltyStarEarnedNotice ?? '🎉 +1 Star Earned on this delivered order!',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: isOrderEligible
                            ? (isDark ? const Color(0xFF86EFAC) : const Color(0xFF15803D))
                            : subColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 10),

          // Compact 5-Star Visual Progress Bar (NO Star Text Labels!)
          Row(
            children: List.generate(5, (index) {
              final step = index + 1;
              final filled = _loyalty.starsCount >= step;

              return Expanded(
                child: Container(
                  height: 36,
                  margin: EdgeInsets.only(right: index < 4 ? 5 : 0),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    gradient: filled
                        ? const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFB45309)])
                        : null,
                    color: filled ? null : (isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF1F5F9)),
                    border: Border.all(
                      color: filled ? const Color(0xFFFBBF24) : borderTileColor,
                      width: 1.2,
                    ),
                    boxShadow: filled
                        ? [
                            BoxShadow(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                              blurRadius: 6,
                            )
                          ]
                        : null,
                  ),
                  child: Center(
                    child: Icon(
                      Icons.star_rounded,
                      size: 20,
                      color: filled ? Colors.white : (isDark ? Colors.white38 : const Color(0xFF94A3B8)),
                    ),
                  ),
                ),
              );
            }),
          ),

          if (!isUnlocked) ...[
            const SizedBox(height: 8),
            Center(
              child: Text(
                l10n?.loyaltyKeepCollectingNotice('${5 - _loyalty.starsCount}') ??
                    '⭐ Collect ${5 - _loyalty.starsCount} more Stars to unlock your next Lucky Scratch Card!',
                style: TextStyle(fontSize: 11, color: subColor, fontWeight: FontWeight.w500),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
