import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../models/models.dart';
import '../../../core/cart_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  PaymentType _paymentType = PaymentType.cod;
  bool _loading = false;

  Future<void> _placeOrder() async {
    setState(() => _loading = true);
    await Future.delayed(const Duration(seconds: 1)); 
    if (mounted) {
      CartService.instance.clearCart();
      context.pushReplacement('/cart/checkout/success?orderId=demo');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Address
            Card(
              child: ListTile(
                leading: const Icon(Icons.location_on_outlined),
                title: const Text('Delivery Address', style: TextStyle(fontWeight: FontWeight.w700)),
                subtitle: const Text('No address selected'),
                trailing: TextButton(
                  onPressed: () {},
                  child: const Text('Select'),
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Payment
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Payment Method', style: TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    Row(
                      children: PaymentType.values.map((type) {
                        final isSelected = _paymentType == type;
                        return Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _paymentType = type),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              decoration: BoxDecoration(
                                color: isSelected ? const Color(0xFF0EA5E9) : Colors.white,
                                border: Border.all(
                                  color: isSelected ? const Color(0xFF0EA5E9) : const Color(0xFFCBD5E1),
                                ),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Center(
                                child: Text(
                                  type == PaymentType.cod ? '💵 Cash' : '🏦 Pay Later',
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : const Color(0xFF334155),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Summary
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Order Summary', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    const SizedBox(height: 12),
                    ...CartService.instance.items.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '${item.item.name} (${item.variant.label}) x ${item.quantity}',
                              style: const TextStyle(fontSize: 14),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            '\$ ${((item.variant.price ?? 0.0) * item.quantity).toStringAsFixed(1)}',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    )),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total to Pay', style: TextStyle(fontWeight: FontWeight.w700)),
                        Text(
                          '\$ ${CartService.instance.finalTotal.toStringAsFixed(1)}',
                          style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF4CD964), fontSize: 16),
                        ),
                      ],
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _placeOrder,
                child: _loading
                    ? const SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Place Order'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
