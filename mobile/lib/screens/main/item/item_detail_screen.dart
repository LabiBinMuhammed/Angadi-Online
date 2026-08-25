import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../core/cart_service.dart';
import '../../../core/language_service.dart';
import '../../../theme/theme_service.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/tutorial/tutorial_manager.dart';

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
      supabase.from('items').select('*, item_images(*), item_translations(*)').eq('id', widget.itemId).single(),
      supabase
          .from('vw_item_variants_with_fallback')
          .select('*, variant_translations(*)')
          .eq('item_id', widget.itemId)
          .eq('is_active', true)
          .order('is_default', ascending: false),
      supabase.from('item_sell_config').select('*').eq('item_id', widget.itemId).maybeSingle(),
      supabase.from('units').select('*'),
    ]);

    final item      = Item.fromJson(results[0] as Map<String, dynamic>);
    final variants  = (results[1] as List).map((j) => ItemVariant.fromJson(j)).toList();
    final config    = results[2] != null
        ? ItemSellConfig.fromJson(results[2] as Map<String, dynamic>)
        : null;
    final units     = (results[3] as List).map((j) => Unit.fromJson(j)).toList();

    _selected = variants.isNotEmpty
        ? variants.firstWhere((v) => v.isDefault, orElse: () => variants.first)
        : ItemVariant(
            id: '',
            itemId: item.id,
            variantType: config?.sellMode == SellMode.manual ? VariantType.manual : VariantType.packed,
            label: '',
            price: config?.pricePerBaseUnit ?? 0.0,
            isDefault: true,
            isActive: true,
          );
    return _Data(item: item, variants: variants, config: config, units: units);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;

    return FutureBuilder<_Data>(
      future: _future,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final d = snapshot.data!;
        final localizedName = d.item.getLocalizedName(LanguageService.instance.locale.languageCode);
        final localizedDesc = d.item.getLocalizedDescription(LanguageService.instance.locale.languageCode);
        final activeImg = (_selected?.imageUrl != null && _selected!.imageUrl!.trim().isNotEmpty)
            ? _selected!.imageUrl!.trim()
            : d.item.imageUrl;

        return Scaffold(
          backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
          body: Stack(
            children: [
              CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  // Slivers App Bar for hero image
                  SliverAppBar(
                    expandedHeight: 320,
                    pinned: true,
                    stretch: true,
                    backgroundColor: kWaTeal,
                    foregroundColor: Colors.white,
                    leading: Container(
                      margin: const EdgeInsets.all(8),
                      decoration: const BoxDecoration(
                        color: Colors.black26,
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                    flexibleSpace: FlexibleSpaceBar(
                      stretchModes: const [StretchMode.zoomBackground],
                      background: Stack(
                        fit: StackFit.expand,
                        children: [
                          activeImg != null
                              ? Image.network(activeImg, fit: BoxFit.cover)
                              : const Center(child: Text('📦', style: TextStyle(fontSize: 80))),
                          // Bottom shadow overlay
                          const Positioned.fill(
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Colors.black54, Colors.transparent, Colors.black38],
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  SliverToBoxAdapter(
                    child: Container(
                      transform: Matrix4.translationValues(0, -24, 0),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                        border: Border.all(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      padding: const EdgeInsets.fromLTRB(24, 32, 24, 120),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Category / Unit label
                          if (d.config != null) ...[
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: kWaTeal.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    d.config!.sellMode.name.toUpperCase(),
                                    style: TextStyle(
                                      color: kWaTeal,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                          ],

                          Text(
                            localizedName,
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 8),

                          Builder(
                            builder: (context) {
                              double displayPrice;
                              String suffix = '';
                              if (d.config?.sellMode == SellMode.manual) {
                                displayPrice = d.config?.pricePerBaseUnit ?? 0.0;
                                final unitSymbol = d.units.firstWhere((u) => u.id == d.config?.baseUnitId, orElse: () => const Unit(id: '', name: '', symbol: 'kg', unitGroupId: '', baseMultiplier: 1.0)).symbol;
                                suffix = ' / $unitSymbol';
                              } else if (d.config?.sellMode == SellMode.dynamic) {
                                displayPrice = (d.config?.pricePerBaseUnit ?? 0.0) * (_selected?.value ?? 1.0);
                              } else {
                                displayPrice = _selected?.price ?? 0.0;
                              }

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '₹${displayPrice.toStringAsFixed(0)}$suffix',
                                    style: TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                      color: kWaTeal,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                ],
                              );
                            },
                          ),

                          if (localizedDesc != null && localizedDesc.isNotEmpty) ...[
                            Text(
                              localizedDesc,
                              style: TextStyle(
                                color: isDark ? Colors.white60 : const Color(0xFF64748B),
                                fontSize: 14,
                                height: 1.5,
                              ),
                            ),
                            const Divider(height: 40),
                          ] else
                            const SizedBox(height: 16),

                          // Variants Options
                          if (d.variants.isNotEmpty) ...[
                            Text(
                              l10n.selectOption,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: d.variants.map((v) {
                                final isSelected = _selected?.id == v.id;
                                return GestureDetector(
                                  onTap: () => setState(() => _selected = v),
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 150),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    decoration: BoxDecoration(
                                      color: isSelected ? kWaTeal : (isDark ? const Color(0xFF0F172A) : Colors.white),
                                      border: Border.all(
                                        color: isSelected ? kWaTeal : (isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                                        width: isSelected ? 2 : 1.5,
                                      ),
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: isSelected ? [
                                        BoxShadow(
                                          color: kWaTeal.withOpacity(0.2),
                                          blurRadius: 10,
                                          offset: const Offset(0, 4),
                                        )
                                      ] : [],
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (isSelected) ...[
                                          const Icon(Icons.check, size: 16, color: Colors.white),
                                          const SizedBox(width: 6),
                                        ],
                                        Text(
                                          v.price != null
                                              ? '${v.getLocalizedLabel(LanguageService.instance.locale.languageCode)} — ₹${v.price!.toStringAsFixed(0)}'
                                              : v.getLocalizedLabel(LanguageService.instance.locale.languageCode),
                                          style: TextStyle(
                                            color: isSelected ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF334155)),
                                            fontWeight: FontWeight.w700,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                            const Divider(height: 40),
                          ],

                          // Quantity Selector
                          if (d.config?.allowCustomQuantity == true) ...[
                            Row(
                              children: [
                                Text(
                                  l10n.quantityLabel,
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                                  ),
                                ),
                                const Spacer(),
                                Container(
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  child: Row(
                                    children: [
                                      IconButton(
                                        icon: Icon(Icons.remove, size: 20, color: isDark ? Colors.white70 : const Color(0xFF475569)),
                                        onPressed: () => setState(() => _quantity = (_quantity - 1.0).clamp(1.0, 99.0)),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        _quantity % 1 == 0 ? _quantity.toInt().toString() : _quantity.toStringAsFixed(1),
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w800,
                                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      IconButton(
                                        icon: Icon(Icons.add, size: 20, color: isDark ? Colors.white70 : const Color(0xFF475569)),
                                        onPressed: () => setState(() => _quantity += 1.0),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                          const SizedBox(height: 120),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              // Floating Sticky Add to Cart Bottom capsule
              Positioned(
                bottom: 24,
                left: 24,
                right: 24,
                child: Container(
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      )
                    ],
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Row(
                    children: [
                      // Total display
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.totalLabel,
                              style: TextStyle(fontSize: 12, color: isDark ? Colors.white60 : const Color(0xFF64748B), fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 2),
                            Builder(
                              builder: (context) {
                                final unitPrice = d.config?.sellMode == SellMode.manual
                                    ? (d.config?.pricePerBaseUnit ?? 0.0)
                                    : d.config?.sellMode == SellMode.dynamic
                                        ? ((d.config?.pricePerBaseUnit ?? 0.0) * (_selected?.value ?? 1.0))
                                        : (_selected?.price ?? 0.0);
                                return Text(
                                  '₹${(unitPrice * _quantity).toStringAsFixed(0)}',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.w800,
                                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Add Button
                      ElevatedButton(
                        onPressed: () {
                          if (_selected != null) {
                            CartService.instance.addItem(
                              d.item,
                              _selected!,
                              quantity: _quantity,
                              sellConfig: d.config,
                            );
                            setState(() => _added = true);
                            TutorialManager.instance.triggerBagTutorial(context);
                            Future.delayed(const Duration(seconds: 2), () {
                              if (mounted) setState(() => _added = false);
                            });
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _added ? const Color(0xFF22C55E) : kWaTeal,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          elevation: 0,
                        ),
                        child: Row(
                          children: [
                            Icon(_added ? Icons.check_circle_outline : Icons.shopping_bag_outlined, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              _added ? l10n.addedToCartLabel : l10n.addToCartLabel,
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
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
  final List<Unit> units;
  _Data({required this.item, required this.variants, this.config, required this.units});
}
