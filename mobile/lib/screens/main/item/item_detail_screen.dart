import 'package:flutter/material.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../core/cart_service.dart';

class ItemDetailScreen extends StatefulWidget {
  final String itemId;
  const ItemDetailScreen({super.key, required this.itemId});

  @override
  State<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends State<ItemDetailScreen> {
  late Future<_Data> _future;
  ItemVariant? _selected;
  double _quantity = 1.0;
  bool _added = false;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<_Data> _fetch() async {
    final results = await Future.wait([
      supabase.from('items').select('*, item_images(*)').eq('id', widget.itemId).single(),
      supabase
          .from('vw_item_variants_with_fallback')
          .select('*')
          .eq('item_id', widget.itemId)
          .eq('is_active', true)
          .order('is_default', ascending: false),
      supabase.from('item_sell_config').select('*').eq('item_id', widget.itemId).maybeSingle(),
    ]);

    final item      = Item.fromJson(results[0] as Map<String, dynamic>);
    final variants  = (results[1] as List).map((j) => ItemVariant.fromJson(j)).toList();
    final config    = results[2] != null
        ? ItemSellConfig.fromJson(results[2] as Map<String, dynamic>)
        : null;

    _selected = variants.firstWhere((v) => v.isDefault, orElse: () => variants.first);
    return _Data(item: item, variants: variants, config: config);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_Data>(
      future: _future,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final d = snapshot.data!;
        return Scaffold(
          appBar: AppBar(title: Text(d.item.name)),
          body: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image
                Container(
                  width: double.infinity, height: 240,
                  color: const Color(0xFFF1F5F9),
                  child: (_selected?.imageUrl != null && _selected!.imageUrl!.trim().isNotEmpty)
                      ? Image.network(_selected!.imageUrl!.trim(), fit: BoxFit.cover)
                      : d.item.imageUrl != null
                          ? Image.network(d.item.imageUrl!, fit: BoxFit.cover)
                          : const Center(child: Text('📦', style: TextStyle(fontSize: 60))),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(d.item.name,
                          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                      if (d.item.description != null) ...[
                        const SizedBox(height: 8),
                        Text(d.item.description!,
                            style: const TextStyle(color: Color(0xFF64748B), fontSize: 14)),
                      ],
                      if (d.config != null) ...[
                        const SizedBox(height: 12),
                        Chip(label: Text(d.config!.sellMode.name.toUpperCase())),
                        if (d.config!.pricePerBaseUnit != null)
                          Text('₹${d.config!.pricePerBaseUnit!.toStringAsFixed(0)} / unit',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      ],

                      const Divider(height: 32),

                      // Variants
                      if (d.variants.isNotEmpty) ...[
                        const Text('Select Option',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8, runSpacing: 8,
                          children: d.variants.map((v) {
                            final isSelected = _selected?.id == v.id;
                            return GestureDetector(
                              onTap: () => setState(() => _selected = v),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFF0EA5E9) : Colors.white,
                                  border: Border.all(
                                    color: isSelected ? const Color(0xFF0EA5E9) : const Color(0xFFCBD5E1),
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  v.price != null ? '${v.label} — ₹${v.price!.toStringAsFixed(0)}' : v.label,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : const Color(0xFF334155),
                                    fontWeight: FontWeight.w600, fontSize: 13,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],

                      // Quantity
                      if (d.config?.allowCustomQuantity == true) ...[
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            const Text('Quantity', style: TextStyle(fontWeight: FontWeight.w600)),
                            const Spacer(),
                            IconButton(icon: const Icon(Icons.remove_circle_outline),
                                onPressed: () => setState(() => _quantity = (_quantity - 1.0).clamp(0.1, 99.0))),
                            Text(
                              _quantity % 1 == 0
                                  ? _quantity.toInt().toString()
                                  : _quantity.toStringAsFixed(1),
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                            ),
                            IconButton(icon: const Icon(Icons.add_circle_outline),
                                onPressed: () => setState(() => _quantity += 1.0)),
                          ],
                        ),
                      ],

                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            if (_selected != null) {
                              CartService.instance.addItem(
                                d.item,
                                _selected!,
                                quantity: _quantity,
                                sellConfig: d.config,
                              );
                              setState(() => _added = true);
                              Future.delayed(const Duration(seconds: 2), () {
                                if (mounted) setState(() => _added = false);
                              });
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _added ? const Color(0xFF22C55E) : const Color(0xFF0EA5E9),
                          ),
                          child: Text(_added ? '✓ Added to cart' : '🛒 Add to cart'),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Data {
  final Item item;
  final List<ItemVariant> variants;
  final ItemSellConfig? config;
  _Data({required this.item, required this.variants, this.config});
}
