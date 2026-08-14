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
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: cardBg,
        boxShadow: [
          BoxShadow(
            color: isDark
                ? const Color(0xFF0F172A).withValues(alpha: 0.35)
                : const Color(0xFF64748B).withValues(alpha: 0.08),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
        border: Border.all(color: borderTileColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: const LinearGradient(
                        colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFF59E0B).withValues(alpha: 0.4),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                    child: const Icon(Icons.star_rounded, size: 22, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
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
                      const SizedBox(height: 2),
                      Text(
                        l10n?.loyaltyProgressLabel('${_loyalty.starsCount.clamp(0, 5)}') ??
                            '${_loyalty.starsCount.clamp(0, 5)} / 5 Stars Collected',
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: subColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(
                  color: isUnlocked
                      ? const Color(0xFF22C55E).withValues(alpha: 0.18)
                      : const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isUnlocked ? const Color(0xFF22C55E) : const Color(0xFFF59E0B),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.star_rounded,
                      size: 13,
                      color: isUnlocked ? const Color(0xFF22C55E) : const Color(0xFFD97706),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${_loyalty.starsCount.clamp(0, 5)} / 5',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w800,
                        color: isUnlocked ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          if (widget.orderAmount != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isOrderEligible
                    ? const Color(0xFF22C55E).withValues(alpha: 0.12)
                    : (isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFF1F5F9)),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isOrderEligible
                      ? const Color(0xFF22C55E).withValues(alpha: 0.3)
                      : borderTileColor,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.auto_awesome_rounded,
                    size: 15,
                    color: isOrderEligible ? const Color(0xFF22C55E) : const Color(0xFFF59E0B),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      l10n?.loyaltyStarEarnedNotice ?? '🎉 +1 Star Earned on this delivered order!',
                      style: TextStyle(
                        fontSize: 11.5,
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

          // 5-Star Visual Progress Bar (Compact without text labels)
          Row(
            children: List.generate(5, (index) {
              final step = index + 1;
              final filled = _loyalty.starsCount >= step;

              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: index < 4 ? 6 : 0),
                  padding: const EdgeInsets.symmetric(vertical: 7),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
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
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.35),
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

          const SizedBox(height: 10),

          // Unlocked Scratch Card Banner or Info
          if (isUnlocked)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: const LinearGradient(
                  colors: [Color(0xFF22C55E), Color(0xFF15803D)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF22C55E).withValues(alpha: 0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const Icon(Icons.card_giftcard_rounded, size: 28, color: Colors.white),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n?.loyaltyScratchCardUnlockedTitle ?? '🎉 Lucky Scratch Card Unlocked!',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          l10n?.loyaltyScratchCardUnlockedDesc ?? 'Scratch to reveal your guaranteed ₹2–₹15 Angadi Credit reward!',
                          style: const TextStyle(fontSize: 11, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF15803D),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    onPressed: _openScratchCard,
                    child: Text(
                      l10n?.loyaltyScratchNowBtn ?? 'Scratch Now 🎟️',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
            )
          else
            Center(
              child: Text(
                l10n?.loyaltyKeepCollectingNotice('${5 - _loyalty.starsCount}') ??
                    '⭐ Collect ${5 - _loyalty.starsCount} more Stars to unlock your next Lucky Scratch Card!',
                style: TextStyle(fontSize: 11, color: subColor, fontWeight: FontWeight.w500),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }
}
