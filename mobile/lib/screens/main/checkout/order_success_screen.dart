import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';

class OrderSuccessScreen extends StatelessWidget {
  final String orderId;
  const OrderSuccessScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('✅', style: TextStyle(fontSize: 72)),
                const SizedBox(height: 24),
                Text(AppLocalizations.of(context)!.orderPlacedTitle,
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(AppLocalizations.of(context)!.orderIdLabel(orderId.substring(0, orderId.length.clamp(0, 8)).toUpperCase()),
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 14)),
                const SizedBox(height: 12),
                const Text(
                  'Your order has been received and will be packed shortly.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () => context.go('/orders'),
                  child: Text(AppLocalizations.of(context)!.viewMyOrdersButton),
                ),
                const SizedBox(height: 12),
                TextButton(
                  onPressed: () => context.go('/home'),
                  child: Text(AppLocalizations.of(context)!.continueShoppingButton),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
