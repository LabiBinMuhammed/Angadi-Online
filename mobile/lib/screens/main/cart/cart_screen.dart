import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/cart_service.dart';
import '../../../models/models.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final double _discount = 5.2; // Match original hardcode/UI discount

  String _getFallbackEmoji(Item item) {
    final name = item.name.toLowerCase();
    if (name.contains('apple')) return '🍎';
    if (name.contains('carrot')) return '🥕';
    if (name.contains('banana')) return '🍌';
    if (name.contains('orange')) return '🍊';
    if (name.contains('potato')) return '🥔';
    if (name.contains('tomato')) return '🍅';
    if (name.contains('milk') || name.contains('dairy')) return '🥛';
    if (name.contains('bread')) return '🍞';
    if (name.contains('egg')) return '🥚';
    return '📦';
  }

  @override
  Widget build(BuildContext context) {
    const kBg = Color(0xFFFAFAFA);
    const kGreen = Color(0xFF4CD964);
    final cart = CartService.instance;

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: ListenableBuilder(
          listenable: cart,
          builder: (context, _) {
            final cartItems = cart.items;
            final subtotal = cart.subtotal;
            final finalTotal = cart.finalTotal;

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      GestureDetector(
                        onTap: () => context.go('/home'),
                        child: Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.grey[200]!),
                          ),
                          child: const Icon(Icons.arrow_back, color: Color(0xFF555555)),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text(
                            'My Bag',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF1E4D1E),
                              letterSpacing: -1,
                            ),
                          ),
                          Text(
                            '${cartItems.length} items',
                            style: const TextStyle(
                              fontSize: 16,
                              color: Colors.grey,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Cart Items
                Expanded(
                  child: cartItems.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                'Your bag is empty',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: () => context.go('/home'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: kGreen,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                ),
                                child: const Text('Browse Shops', style: TextStyle(color: Colors.white)),
                              )
                            ],
                          ),
                        )
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
                          children: [
                            ...cartItems.map((item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 16),
                                  child: Dismissible(
                                    key: ValueKey(item.variant.id),
                                    direction: DismissDirection.endToStart,
                                    onDismissed: (_) => cart.removeItem(item.variant.id),
                                    background: Container(
                                      alignment: Alignment.centerRight,
                                      padding: const EdgeInsets.only(right: 24),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFF4757),
                                        borderRadius: BorderRadius.circular(24),
                                      ),
                                      child: const Icon(Icons.delete, color: Colors.white),
                                    ),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(24),
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withValues(alpha: 0.03),
                                            blurRadius: 20,
                                            offset: const Offset(0, 4),
                                          )
                                        ],
                                      ),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 70, height: 70,
                                            alignment: Alignment.center,
                                            child: item.variant.imageUrl != null && item.variant.imageUrl!.trim().isNotEmpty
                                                ? Image.network(item.variant.imageUrl!, fit: BoxFit.cover)
                                                : item.item.imageUrl != null
                                                    ? Image.network(item.item.imageUrl!, fit: BoxFit.cover)
                                                    : Text(_getFallbackEmoji(item.item), style: const TextStyle(fontSize: 40)),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  item.item.name,
                                                  style: const TextStyle(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w700,
                                                    color: Color(0xFF1A1A1A),
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  item.variant.label,
                                                  style: const TextStyle(
                                                    fontSize: 12,
                                                    color: Colors.grey,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                                const SizedBox(height: 4),
                                                Text(
                                                  item.sellConfig?.sellMode == SellMode.manual
                                                      ? '₹ ${(item.sellConfig?.pricePerBaseUnit ?? 0.0).toStringAsFixed(0)} / kg'
                                                      : '₹ ${(item.variant.price ?? 0.0).toStringAsFixed(0)}',
                                                  style: const TextStyle(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.w800,
                                                    color: kGreen,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              Container(
                                                width: 24, height: 24,
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  shape: BoxShape.circle,
                                                  border: Border.all(color: Colors.grey[200]!),
                                                ),
                                                child: const Icon(Icons.favorite, color: Color(0xFFFF4757), size: 12),
                                              ),
                                              const SizedBox(height: 12),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.white,
                                                  borderRadius: BorderRadius.circular(12),
                                                  boxShadow: [
                                                    BoxShadow(
                                                      color: Colors.black.withValues(alpha: 0.04),
                                                      blurRadius: 8,
                                                    )
                                                  ],
                                                ),
                                                child: Row(
                                                  children: [
                                                    GestureDetector(
                                                      onTap: () => cart.updateQuantity(item.variant.id, item.quantity - 1.0),
                                                      child: const Icon(Icons.remove, size: 16, color: Colors.grey),
                                                    ),
                                                    const SizedBox(width: 12),
                                                    Text(
                                                      item.quantity % 1 == 0
                                                          ? item.quantity.toInt().toString()
                                                          : item.quantity.toStringAsFixed(1),
                                                      style: const TextStyle(
                                                        fontSize: 14,
                                                        fontWeight: FontWeight.w600,
                                                      ),
                                                    ),
                                                    const SizedBox(width: 12),
                                                    GestureDetector(
                                                      onTap: () => cart.updateQuantity(item.variant.id, item.quantity + 1.0),
                                                      child: const Icon(Icons.add, size: 16, color: kGreen),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          )
                                        ],
                                      ),
                                    ),
                                  ),
                                )),

                            // Promo code
                            Container(
                              margin: const EdgeInsets.symmetric(vertical: 24),
                              padding: const EdgeInsets.only(left: 20, right: 6, top: 6, bottom: 6),
                              decoration: BoxDecoration(color: const Color(0xFFF5F5F5), borderRadius: BorderRadius.circular(20)),
                              child: Row(
                                children: [
                                  const Expanded(
                                    child: TextField(
                                      decoration: InputDecoration(
                                        hintText: 'Promo Code',
                                        border: InputBorder.none,
                                        hintStyle: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey),
                                      ),
                                      style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF333333)),
                                    ),
                                  ),
                                  WidgetApplyButton(),
                                ],
                              ),
                            ),

                            // Summary
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Color(0xFF1A1A1A))),
                                Text('₹ ${subtotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: kGreen)),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Discount', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Color(0xFF1A1A1A))),
                                Text('₹ ${_discount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFFFF4757))),
                              ],
                            ),
                            Container(height: 1, color: Colors.grey[200], margin: const EdgeInsets.symmetric(vertical: 16)),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Total', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Color(0xFF1A1A1A))),
                                Text('₹ ${finalTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: kGreen)),
                              ],
                            ),
                            const SizedBox(height: 24),
                            
                            // Checkout Button
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () => context.push('/cart/checkout'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: kGreen,
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                                  elevation: 8,
                                  shadowColor: kGreen.withValues(alpha: 0.4),
                                ),
                                child: const Text(
                                  'Proceed To Checkout',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                                ),
                              ),
                            )
                          ],
                        ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class WidgetApplyButton extends StatelessWidget {
  const WidgetApplyButton({super.key});

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF1E4D1E),
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      ),
      child: const Text('Apply', style: TextStyle(fontWeight: FontWeight.w600)),
    );
  }
}

