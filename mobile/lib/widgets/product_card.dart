import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/models.dart';
import '../core/cart_service.dart';
import '../theme/theme_service.dart';
import '../core/language_service.dart';
import '../l10n/app_localizations.dart';

// Colors mapped from ThemeService
Color get _kText => ThemeService.instance.isDarkMode ? Colors.white : const Color(0xFF1A1A1A);
Color get _kSub => ThemeService.instance.isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF555555);
Color get _kCardBg => ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : Colors.white;
Color get _kBorder => ThemeService.instance.isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
const _kGreen = Color(0xFF4CD964);
const _kGreenDark = Color(0xFF32B84A);

class ProductCard extends StatefulWidget {
  final Item item;
  final bool isLiked;
  final VoidCallback onLikeToggle;
  final List<Unit> units;
  final List<Category> categories;
  final VoidCallback? onTap;

  const ProductCard({
    super.key,
    required this.item,
    required this.isLiked,
    required this.onLikeToggle,
    required this.units,
    required this.categories,
    this.onTap,
  });

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  late String _selectedVariantId;
  double _localQty = 1.0;
  late TextEditingController _qtyController;

  @override
  void initState() {
    super.initState();
    // Resolve initial variant
    if (widget.item.itemVariants.isNotEmpty) {
      final defaultVariant = widget.item.itemVariants.firstWhere(
        (v) => v.isDefault,
        orElse: () => widget.item.itemVariants.first,
      );
      _selectedVariantId = defaultVariant.id;
    } else {
      _selectedVariantId = '';
    }

    _qtyController = TextEditingController(text: '1.0');
  }

  @override
  void didUpdateWidget(covariant ProductCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    // If item changes, re-evaluate initial variant
    if (oldWidget.item.id != widget.item.id) {
      if (widget.item.itemVariants.isNotEmpty) {
        final defaultVariant = widget.item.itemVariants.firstWhere(
          (v) => v.isDefault,
          orElse: () => widget.item.itemVariants.first,
        );
        _selectedVariantId = defaultVariant.id;
      } else {
        _selectedVariantId = '';
      }
      _qtyController.text = '1.0';
      _localQty = 1.0;
    }
  }

  @override
  void dispose() {
    _qtyController.dispose();
    super.dispose();
  }

  String _formatQty(double qty) {
    if (qty == qty.toInt().toDouble()) {
      return qty.toInt().toString();
    } else {
      return qty.toStringAsFixed(1);
    }
  }

  String _getCatIcon(String name) {
    final n = name.toLowerCase();
    if (n.contains('vegetable') || n.contains('veg')) return '🥦';
    if (n.contains('fruit')) return '🍎';
    if (n.contains('dairy')) return '🥛';
    if (n.contains('grain') || n.contains('rice') || n.contains('wheat')) return '🌾';
    if (n.contains('spice')) return '🌶️';
    if (n.contains('bakery') || n.contains('bread')) return '🍞';
    if (n.contains('oil')) return '🫙';
    if (n.contains('meat') || n.contains('fish')) return '🥩';
    return '📦';
  }

  CartItem? _findCartItem(ItemVariant variant) {
    final config = widget.item.itemSellConfig.isNotEmpty ? widget.item.itemSellConfig.first : null;
    final isManualOrDynamic = config?.sellMode == SellMode.manual || config?.sellMode == SellMode.dynamic;
    
    for (var cartItem in CartService.instance.items) {
      if (cartItem.item.id == widget.item.id) {
        if (isManualOrDynamic) {
          return cartItem;
        } else {
          if (cartItem.variant.id == variant.id) {
            return cartItem;
          }
        }
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final langCode = LanguageService.instance.locale.languageCode;

    final config = widget.item.itemSellConfig.isNotEmpty ? widget.item.itemSellConfig.first : null;
    
    return AnimatedBuilder(
      animation: CartService.instance,
      builder: (context, _) {
        final selectedVariant = widget.item.itemVariants.firstWhere(
          (v) => v.id == _selectedVariantId,
          orElse: () => widget.item.itemVariants.isNotEmpty
              ? widget.item.itemVariants.first
              : const ItemVariant(id: '', itemId: '', variantType: VariantType.manual, label: '', isDefault: false, isActive: true),
        );

        final activeImageUrl = (selectedVariant.id.isNotEmpty && selectedVariant.imageUrl != null && selectedVariant.imageUrl!.trim().isNotEmpty)
            ? selectedVariant.imageUrl!.trim()
            : (widget.item.imageUrl != null && widget.item.imageUrl!.trim().isNotEmpty)
                ? widget.item.imageUrl!.trim()
                : null;

        final cartItem = _findCartItem(selectedVariant);

        double price;
        String priceUnit = '';
        if (config?.sellMode == SellMode.manual) {
          final qty = cartItem?.quantity ?? _localQty;
          price = (config?.pricePerBaseUnit ?? 0.0) * qty;
          final unitSymbol = widget.units.firstWhere((u) => u.id == config?.baseUnitId, orElse: () => const Unit(id: '', name: '', symbol: 'kg', unitGroupId: '', baseMultiplier: 1.0)).symbol;
          priceUnit = ' / $unitSymbol';
        } else if (config?.sellMode == SellMode.dynamic) {
          price = (config?.pricePerBaseUnit ?? 0.0) * (selectedVariant.value ?? 1.0);
        } else {
          price = selectedVariant.price ?? 0.0;
        }

        // Keep qty text input matching current state
        final currentQty = cartItem?.quantity ?? _localQty;
        final formatted = _formatQty(currentQty);
        final parsed = double.tryParse(_qtyController.text);
        if (parsed != currentQty && _qtyController.text != formatted) {
          _qtyController.text = formatted;
        }

        return Container(
          decoration: BoxDecoration(
            color: _kCardBg,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: _kBorder),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 24,
                offset: const Offset(0, 8),
              )
            ],
          ),
          child: Stack(
            children: [
              GestureDetector(
                onTap: widget.onTap ?? () => context.push('/home/shop/${widget.item.shopId}'),
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 52),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(
                        height: 100,
                        child: Center(
                          child: activeImageUrl != null
                              ? Image.network(activeImageUrl, fit: BoxFit.contain)
                              : Text(
                                  _getCatIcon(
                                    widget.categories.firstWhere(
                                      (c) => c.id == widget.item.categoryId,
                                      orElse: () => const Category(id: '', name: ''),
                                    ).name,
                                  ),
                                  style: const TextStyle(fontSize: 48),
                                ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              widget.item.getLocalizedName(langCode),
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: _kText),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('₹${price.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: _kGreen)),
                              if (priceUnit.isNotEmpty)
                                Text(priceUnit, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: _kSub)),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      
                      // Variant Selector Wrap
                      if (config?.sellMode == SellMode.manual)
                        const SizedBox(height: 28)
                      else if ((config?.sellMode == SellMode.dynamic ||
                              config?.sellMode == SellMode.portion ||
                              ((config == null || config.sellMode == SellMode.packed) && widget.item.itemVariants.length > 1)) &&
                          widget.item.itemVariants.isNotEmpty)
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: widget.item.itemVariants.map((v) {
                            final isActive = v.id == _selectedVariantId;
                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedVariantId = v.id;
                                });
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: isActive ? _kGreen : _kBorder,
                                    width: isActive ? 1.5 : 1,
                                  ),
                                  color: isActive ? const Color(0xFFE8F9EC) : _kCardBg,
                                ),
                                child: Text(
                                  v.getLocalizedLabel(langCode),
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    color: isActive ? _kGreenDark : (ThemeService.instance.isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF4B5563)),
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        )
                      else
                        const SizedBox(height: 28),
                    ],
                  ),
                ),
              ),
              
              // Heart Like Button
              Positioned(
                top: 14,
                right: 14,
                child: GestureDetector(
                  onTap: widget.onLikeToggle,
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: _kCardBg,
                      shape: BoxShape.circle,
                      border: Border.all(color: _kBorder),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.06),
                          blurRadius: 12,
                        )
                      ],
                    ),
                    child: Icon(widget.isLiked ? Icons.favorite : Icons.favorite_border, color: widget.isLiked ? Colors.redAccent : Colors.grey, size: 14),
                  ),
                ),
              ),
              
              // Bottom Action Button (Add / Quantity Counters)
              Positioned(
                bottom: 8,
                right: 8,
                left: 8,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (config?.sellMode == SellMode.manual) ...[
                      if (cartItem != null)
                        Expanded(
                          child: Row(
                            children: [
                              Expanded(
                                child: Container(
                                  height: 32,
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  decoration: BoxDecoration(
                                    color: _kGreen.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          controller: _qtyController,
                                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _kGreenDark),
                                          decoration: const InputDecoration(
                                            contentPadding: EdgeInsets.zero,
                                            isDense: true,
                                            border: InputBorder.none,
                                          ),
                                          onChanged: (val) {
                                            final parsed = double.tryParse(val) ?? 0.0;
                                            if (parsed > 0) {
                                              CartService.instance.updateQuantity(cartItem.variant.id, parsed);
                                              _localQty = parsed;
                                            }
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        widget.units.firstWhere((u) => u.id == config?.baseUnitId, orElse: () => const Unit(id: '', name: '', symbol: 'kg', unitGroupId: '', baseMultiplier: 1.0)).symbol,
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _kGreenDark),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: () {
                                  CartService.instance.removeItem(cartItem.variant.id);
                                },
                                child: Container(
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    color: Colors.red[50],
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        Expanded(
                          child: Row(
                            children: [
                              Expanded(
                                child: Container(
                                  height: 32,
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  decoration: BoxDecoration(
                                    color: ThemeService.instance.isDarkMode ? const Color(0xFF27272A) : Colors.grey[100],
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: TextField(
                                          controller: _qtyController,
                                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _kText),
                                          decoration: const InputDecoration(
                                            contentPadding: EdgeInsets.zero,
                                            isDense: true,
                                            border: InputBorder.none,
                                          ),
                                          onChanged: (val) {
                                            final parsed = double.tryParse(val) ?? 0.0;
                                            if (parsed > 0) {
                                              setState(() {
                                                _localQty = parsed;
                                              });
                                            }
                                          },
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        widget.units.firstWhere((u) => u.id == config?.baseUnitId, orElse: () => const Unit(id: '', name: '', symbol: 'kg', unitGroupId: '', baseMultiplier: 1.0)).symbol,
                                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _kSub),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              GestureDetector(
                                onTap: () async {
                                  final currentQty = _localQty;
                                  final scName = widget.item.getLocalizedName(langCode);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(l10n.addingToCartMessage(scName)),
                                      duration: const Duration(milliseconds: 500),
                                    ),
                                  );
                                  CartService.instance.addItem(
                                    widget.item,
                                    selectedVariant,
                                    quantity: currentQty,
                                    sellConfig: config,
                                  );
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(l10n.addedToCartMessage(scName)),
                                        duration: const Duration(seconds: 1),
                                      ),
                                    );
                                  }
                                },
                                child: Container(
                                  height: 32,
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  decoration: BoxDecoration(
                                    color: _kGreen,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Center(
                                    child: Text(
                                      l10n.addButtonLabel,
                                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ] else ...[
                      if (cartItem != null)
                        Expanded(
                          child: Container(
                            height: 32,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            decoration: BoxDecoration(
                              color: _kGreen.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: _kGreen.withOpacity(0.3)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    final newQty = cartItem.quantity - 1.0;
                                    if (newQty < 0.01) {
                                      CartService.instance.removeItem(cartItem.variant.id);
                                    } else {
                                      CartService.instance.updateQuantity(cartItem.variant.id, newQty);
                                    }
                                  },
                                  child: const Icon(Icons.remove, size: 16, color: _kGreenDark),
                                ),
                                Text(
                                  _formatQty(cartItem.quantity),
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: _kGreenDark),
                                ),
                                GestureDetector(
                                  onTap: () {
                                    final newQty = cartItem.quantity + 1.0;
                                    CartService.instance.updateQuantity(cartItem.variant.id, newQty);
                                  },
                                  child: const Icon(Icons.add, size: 16, color: _kGreenDark),
                                ),
                              ],
                            ),
                          ),
                        )
                      else ...[
                        Expanded(
                          child: Container(
                            height: 32,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            decoration: BoxDecoration(
                              color: ThemeService.instance.isDarkMode ? const Color(0xFF27272A) : Colors.grey[100],
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                GestureDetector(
                                  onTap: () {
                                    final currentQty = _localQty;
                                    final newQty = (currentQty - 1.0).clamp(1.0, 999.0);
                                    setState(() {
                                      _localQty = newQty;
                                    });
                                  },
                                  child: Icon(Icons.remove, size: 14, color: _kSub),
                                ),
                                Text(
                                  _formatQty(_localQty),
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _kText),
                                ),
                                GestureDetector(
                                  onTap: () {
                                    final currentQty = _localQty;
                                    final newQty = currentQty + 1.0;
                                    setState(() {
                                      _localQty = newQty;
                                    });
                                  },
                                  child: Icon(Icons.add, size: 14, color: _kSub),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () async {
                            final currentQty = _localQty;
                            final scName = widget.item.getLocalizedName(langCode);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(l10n.addingToCartMessage(scName)),
                                duration: const Duration(milliseconds: 500),
                              ),
                            );
                            CartService.instance.addItem(
                              widget.item,
                              selectedVariant,
                              quantity: currentQty,
                              sellConfig: config,
                            );
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).hideCurrentSnackBar();
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(l10n.addedToCartMessage(scName)),
                                  duration: const Duration(seconds: 1),
                                ),
                              );
                            }
                          },
                          child: Container(
                            height: 32,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: _kGreen,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Center(
                              child: Text(
                                l10n.addButtonLabel,
                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
