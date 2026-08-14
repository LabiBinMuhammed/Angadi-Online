import 'package:flutter/material.dart';
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
    final isUnlocked = _loyalty.starsCount >= 5 || _loyalty.scratchCardsUnlocked > 0;
    final isOrderEligible = (widget.orderAmount ?? 0) >= 150.0;

    if (_isLoading) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: Colors.white10),
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
                    width: 38,
                    height: 38,
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
                    child: const Icon(Icons.star_rounded, size: 24, color: Colors.white),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '5-Star Rewards Club ⭐',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Earn 1 Star on delivered orders ₹150+',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withValues(alpha: 0.7),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isUnlocked
                      ? const Color(0xFF22C55E).withValues(alpha: 0.2)
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
                      size: 14,
                      color: isUnlocked ? const Color(0xFF4ADE80) : const Color(0xFFFBBF24),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${_loyalty.starsCount.clamp(0, 5)} / 5 Stars',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isUnlocked ? const Color(0xFF4ADE80) : const Color(0xFFFBBF24),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          if (widget.orderAmount != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isOrderEligible
                    ? const Color(0xFF22C55E).withValues(alpha: 0.12)
                    : Colors.white.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isOrderEligible
                      ? const Color(0xFF22C55E).withValues(alpha: 0.3)
                      : Colors.white10,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.auto_awesome_rounded,
                    size: 16,
                    color: isOrderEligible ? const Color(0xFF4ADE80) : const Color(0xFFFBBF24),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isOrderEligible
                          ? (widget.orderStatus == 'delivered'
                              ? '🎉 +1 Star Earned on this delivered ₹150+ order!'
                              : '⭐ This order qualifies for 1 Star upon delivery (₹150+)!')
                          : 'Orders worth ₹150 or more earn 1 Star towards a Lucky Scratch Card.',
                      style: TextStyle(
                        fontSize: 12,
                        color: isOrderEligible ? const Color(0xFF86EFAC) : Colors.white70,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),

          // 5-Star Visual Progress Bar
          Row(
            children: List.generate(5, (index) {
              final step = index + 1;
              final filled = _loyalty.starsCount >= step;

              return Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: index < 4 ? 6 : 0),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    gradient: filled
                        ? const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFB45309)])
                        : null,
                    color: filled ? null : Colors.white.withValues(alpha: 0.08),
                    border: Border.all(
                      color: filled ? const Color(0xFFFBBF24) : Colors.white12,
                      width: 1.2,
                    ),
                    boxShadow: filled
                        ? [
                            BoxShadow(
                              color: const Color(0xFFF59E0B).withValues(alpha: 0.35),
                              blurRadius: 8,
                            )
                          ]
                        : null,
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.star_rounded,
                        size: 20,
                        color: filled ? Colors.white : Colors.white38,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Star $step',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: filled ? Colors.white : Colors.white38,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),

          const SizedBox(height: 14),

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
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '🎉 Lucky Scratch Card Unlocked!',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Scratch to win ₹2–₹15 Angadi Credit!',
                          style: TextStyle(fontSize: 11, color: Colors.white70),
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
                    child: const Text(
                      'Scratch 🎟️',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
            )
          else
            Center(
              child: Text(
                '⭐ Collect ${5 - _loyalty.starsCount} more Star${(5 - _loyalty.starsCount) > 1 ? 's' : ''} to unlock your next Lucky Scratch Card (₹2–₹15 Credit)!',
                style: const TextStyle(fontSize: 11, color: Colors.white60),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }
}
