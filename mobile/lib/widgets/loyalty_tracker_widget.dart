import 'package:flutter/material.dart';

class LoyaltyTrackerWidget extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return const SizedBox.shrink();
  }
}
