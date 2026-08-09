import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:village_market/core/supabase_client.dart';
import 'package:village_market/theme/theme_service.dart';
import '../../../core/cart_service.dart';
import '../../../core/language_service.dart';
import '../../../models/models.dart';


class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  String? _userRole;
  List<dynamic> _deliverySettings = [];
  List<dynamic> _placedOrders = [];
  List<Unit> _units = [];
  bool _loadingSettings = false;

  @override
  void initState() {
    super.initState();
    _loadUserRole();
    _loadDeliverySettings();
    _loadUnits();
    CartService.instance.addListener(_onCartChanged);
    ThemeService.instance.addListener(_onThemeChanged);
  }

  Future<void> _loadUnits() async {
    try {
      final res = await supabase.from('units').select('*');
      if (mounted) {
        setState(() {
          _units = (res as List).map((u) => Unit.fromJson(u)).toList();
        });
      }
    } catch (e) {
      debugPrint('Error loading units in CartScreen: $e');
    }
  }


  @override
  void dispose() {
    CartService.instance.removeListener(_onCartChanged);
    ThemeService.instance.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  void _onCartChanged() {
    if (mounted) {
      _loadDeliverySettings();
    }
  }

  Future<void> _loadDeliverySettings() async {
    final cart = CartService.instance;
    final shopIds = cart.items.map((i) => i.item.shopId).toSet().toList();
    if (shopIds.isEmpty) return;

    if (mounted) setState(() => _loadingSettings = true);
    try {
      // Fetch settings
      final settingsRes = await supabase
          .from('shop_delivery_settings')
          .select('*')
          .inFilter('shop_id', shopIds);

      // Fetch placed orders (next 7 days)
      final todayStr = DateTime.now().toIso8601String().split('T')[0];
      final maxDateStr = DateTime.now().add(const Duration(days: 7)).toIso8601String().split('T')[0];

      final countsRes = await supabase
          .from('orders')
          .select('shop_id, delivery_date, delivery_slot')
          .inFilter('shop_id', shopIds)
          .not('payment_type', 'is', null)
          .neq('status', 'cancelled')
          .gte('delivery_date', todayStr)
          .lte('delivery_date', maxDateStr);

      if (mounted) {
        setState(() {
          _deliverySettings = settingsRes as List<dynamic>;
          _placedOrders = countsRes as List<dynamic>;
        });
        _applyAutoSuggestion();
      }
    } catch (e) {
      debugPrint('Error loading delivery settings: $e');
    } finally {
      if (mounted) {
        setState(() => _loadingSettings = false);
      }
    }
  }

  Map<String, dynamic> _getSlotStatus(DateTime date) {
    bool morningDisabled = false;
    bool eveningDisabled = false;
    String morningReason = '';
    String eveningReason = '';

    final dateStr = date.toIso8601String().split('T')[0];
    final todayStr = DateTime.now().toIso8601String().split('T')[0];
    final isToday = dateStr == todayStr;

    final now = DateTime.now();
    final currentTimeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}:${now.second.toString().padLeft(2, '0')}';

    final cart = CartService.instance;
    final shopIds = cart.items.map((i) => i.item.shopId).toSet().toList();

    for (final shopId in shopIds) {
      final settings = _deliverySettings.firstWhere(
        (s) => s['shop_id'] == shopId,
        orElse: () => {
          'morning_enabled': true,
          'evening_enabled': true,
          'morning_order_limit': 50,
          'evening_order_limit': 50,
          'morning_cutoff_time': '08:00:00',
          'evening_cutoff_time': '14:00:00'
        },
      );

      // 1. Check if enabled by shop
      if (!(settings['morning_enabled'] as bool)) {
        morningDisabled = true;
        morningReason = 'disabled';
      }
      if (!(settings['evening_enabled'] as bool)) {
        eveningDisabled = true;
        eveningReason = 'disabled';
      }

      // 2. Check cutoff time (if today)
      if (isToday) {
        if (currentTimeStr.compareTo(settings['morning_cutoff_time'] as String) >= 0) {
          morningDisabled = true;
          morningReason = 'cutoff';
        }
        if (currentTimeStr.compareTo(settings['evening_cutoff_time'] as String) >= 0) {
          eveningDisabled = true;
          eveningReason = 'cutoff';
        }
      }

      // 3. Check capacity limit
      final morningPlacedCount = _placedOrders.where((o) =>
          o['shop_id'] == shopId &&
          o['delivery_date'] == dateStr &&
          o['delivery_slot'] == 'morning').length;
      final eveningPlacedCount = _placedOrders.where((o) =>
          o['shop_id'] == shopId &&
          o['delivery_date'] == dateStr &&
          o['delivery_slot'] == 'evening').length;

      if (morningPlacedCount >= (settings['morning_order_limit'] as int)) {
        morningDisabled = true;
        morningReason = 'capacity';
      }
      if (eveningPlacedCount >= (settings['evening_order_limit'] as int)) {
        eveningDisabled = true;
        eveningReason = 'capacity';
      }
    }

    return {
      'morningDisabled': morningDisabled,
      'eveningDisabled': eveningDisabled,
      'morningReason': morningReason,
      'eveningReason': eveningReason,
    };
  }

  void _applyAutoSuggestion() {
    final cart = CartService.instance;
    var date = cart.selectedDate;
    var slot = cart.selectedSlot;

    var status = _getSlotStatus(date);
    if (slot == 'morning' && status['morningDisabled'] as bool) {
      if (!(status['eveningDisabled'] as bool)) {
        cart.setSelectedSlot('evening');
      } else {
        // Find next day's available slot
        for (int i = 1; i <= 7; i++) {
          final nextDate = date.add(Duration(days: i));
          final nextStatus = _getSlotStatus(nextDate);
          if (!(nextStatus['morningDisabled'] as bool)) {
            cart.setSelectedDate(nextDate);
            cart.setSelectedSlot('morning');
            break;
          } else if (!(nextStatus['eveningDisabled'] as bool)) {
            cart.setSelectedDate(nextDate);
            cart.setSelectedSlot('evening');
            break;
          }
        }
      }
    } else if (slot == 'evening' && status['eveningDisabled'] as bool) {
      // Find next day's available slot
      for (int i = 1; i <= 7; i++) {
        final nextDate = date.add(Duration(days: i));
        final nextStatus = _getSlotStatus(nextDate);
        if (!(nextStatus['morningDisabled'] as bool)) {
          cart.setSelectedDate(nextDate);
          cart.setSelectedSlot('morning');
          break;
        } else if (!(nextStatus['eveningDisabled'] as bool)) {
          cart.setSelectedDate(nextDate);
          cart.setSelectedSlot('evening');
          break;
        }
      }
    }
  }

  Widget _buildDeliveryScheduleCard(BuildContext context, Color kCardBg, Color kBorder, Color kText, Color kSubText, Color kGreen) {
    final cart = CartService.instance;
    final date = cart.selectedDate;
    final slot = cart.selectedSlot;

    final dateStr = '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    final status = _getSlotStatus(date);
    final morningDisabled = status['morningDisabled'] as bool;
    final eveningDisabled = status['eveningDisabled'] as bool;
    final morningReason = status['morningReason'] as String;
    final eveningReason = status['eveningReason'] as String;

    String getReasonText(String reason) {
      final l10n = AppLocalizations.of(context)!;
      if (reason == 'cutoff') return l10n.cutoffPassed;
      if (reason == 'capacity') return l10n.limitReached;
      return l10n.unavailable;
    }

    return Container(
      margin: const EdgeInsets.only(top: 24, bottom: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.access_time_filled, color: Color(0xFF4CD964), size: 20),
              const SizedBox(width: 8),
              Text(
                AppLocalizations.of(context)!.deliverySchedule,
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: kText),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Date Selector
          GestureDetector(
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: date,
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 7)),
              );
              if (picked != null) {
                cart.setSelectedDate(picked);
                // Adjust default slot if selected date is today and slot is disabled
                final nextStatus = _getSlotStatus(picked);
                if (slot == 'morning' && nextStatus['morningDisabled'] as bool) {
                  cart.setSelectedSlot('evening');
                } else if (slot == 'evening' && nextStatus['eveningDisabled'] as bool) {
                  cart.setSelectedSlot('morning');
                }
              }
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: kBorder),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.calendar_month, color: kSubText, size: 18),
                      const SizedBox(width: 10),
                      Text(
                        dateStr,
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: kText),
                      ),
                    ],
                  ),
                  Text(
                    AppLocalizations.of(context)!.changeDate,
                    style: const TextStyle(color: Color(0xFF4CD964), fontWeight: FontWeight.w700, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Morning/Evening Slots
          Row(
            children: [
              // Morning
              Expanded(
                child: Opacity(
                  opacity: morningDisabled ? 0.5 : 1.0,
                  child: GestureDetector(
                    onTap: morningDisabled ? null : () => cart.setSelectedSlot('morning'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                      decoration: BoxDecoration(
                        color: slot == 'morning'
                            ? const Color(0xFF4CD964).withOpacity(0.15)
                            : kCardBg,
                        border: Border.all(
                          color: slot == 'morning'
                              ? const Color(0xFF4CD964)
                              : kBorder,
                          width: slot == 'morning' ? 2 : 1,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.wb_sunny,
                            color: slot == 'morning' ? const Color(0xFF1E4D1E) : kSubText,
                            size: 20,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            AppLocalizations.of(context)!.morning,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: slot == 'morning' ? const Color(0xFF1E4D1E) : kSubText,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            morningDisabled ? getReasonText(morningReason) : '7 AM - 12 PM',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: morningDisabled ? Colors.red : kSubText,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              
              // Evening
              Expanded(
                child: Opacity(
                  opacity: eveningDisabled ? 0.5 : 1.0,
                  child: GestureDetector(
                    onTap: eveningDisabled ? null : () => cart.setSelectedSlot('evening'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                      decoration: BoxDecoration(
                        color: slot == 'evening'
                            ? const Color(0xFFF97316).withOpacity(0.15)
                            : kCardBg,
                        border: Border.all(
                          color: slot == 'evening'
                              ? const Color(0xFFF97316)
                              : kBorder,
                          width: slot == 'evening' ? 2 : 1,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.nightlight_round,
                            color: slot == 'evening' ? const Color(0xFFEA580C) : kSubText,
                            size: 20,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            AppLocalizations.of(context)!.evening,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              color: slot == 'evening' ? const Color(0xFFEA580C) : kSubText,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            eveningDisabled ? getReasonText(eveningReason) : '4 PM - 8 PM',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: eveningDisabled ? Colors.red : kSubText,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _loadUserRole() async {
    final user = supabase.auth.currentUser;
    if (user != null) {
      try {
        final profile = await supabase.from('users').select('role').eq('id', user.id).single();
        if (mounted) {
          setState(() {
            _userRole = profile['role'] as String?;
          });
        }
      } catch (e) {
        debugPrint('Error loading role in CartScreen: $e');
      }
    }
  }

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
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;
    final kBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA);
    final kCardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final kText = isDark ? Colors.white : const Color(0xFF1A1A1A);
    final kSubText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF555555);
    final kBorder = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final kTitleColor = isDark ? const Color(0xFF4CD964) : const Color(0xFF1E4D1E);

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
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          GestureDetector(
                            onTap: () {
                              if (context.canPop()) {
                                context.pop();
                              } else {
                                context.go('/home');
                              }
                            },
                            child: Container(
                              width: 44, height: 44,
                              decoration: BoxDecoration(
                                color: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                                shape: BoxShape.circle,
                                border: Border.all(color: ThemeService.instance.isDarkMode ? const Color(0xFF334155) : Colors.grey[200]!),
                              ),
                              child: Icon(
                                Icons.arrow_back,
                                color: ThemeService.instance.isDarkMode ? Colors.white : const Color(0xFF555555),
                              ),
                            ),
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (_userRole == 'shop_owner' || _userRole == 'admin') ...[
                                GestureDetector(
                                  onTap: () => context.push('/vendor/dashboard'),
                                  child: Container(
                                    width: 44, height: 44,
                                    decoration: BoxDecoration(
                                      color: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: ThemeService.instance.isDarkMode ? const Color(0xFF334155) : Colors.grey[200]!),
                                    ),
                                    alignment: Alignment.center,
                                    child: HugeIcon(
                                      icon: HugeIcons.strokeRoundedStore01,
                                      color: ThemeService.instance.isDarkMode ? Colors.white : const Color(0xFF555555),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                              ],
                              if (_userRole == 'admin') ...[
                                GestureDetector(
                                  onTap: () => context.push('/admin/dashboard'),
                                  child: Container(
                                    width: 44, height: 44,
                                    decoration: BoxDecoration(
                                      color: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: ThemeService.instance.isDarkMode ? const Color(0xFF334155) : Colors.grey[200]!),
                                    ),
                                    alignment: Alignment.center,
                                    child: HugeIcon(
                                      icon: HugeIcons.strokeRoundedSecurityCheck,
                                      color: ThemeService.instance.isDarkMode ? Colors.white : const Color(0xFF555555),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                              ],
                              GestureDetector(
                                onTap: () => context.push('/notifications'),
                                child: Container(
                                  width: 44, height: 44,
                                  decoration: BoxDecoration(
                                    color: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                                    shape: BoxShape.circle,
                                    border: Border.all(color: ThemeService.instance.isDarkMode ? const Color(0xFF334155) : Colors.grey[200]!),
                                  ),
                                  alignment: Alignment.center,
                                  child: HugeIcon(
                                    icon: HugeIcons.strokeRoundedNotification01,
                                    color: ThemeService.instance.isDarkMode ? Colors.white : const Color(0xFF555555),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            l10n.myBag,
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              color: kTitleColor,
                              letterSpacing: -1,
                            ),
                          ),
                          Text(
                            l10n.itemsCount(cartItems.length),
                            style: TextStyle(
                              fontSize: 16,
                              color: kSubText,
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
                              Text(
                                l10n.yourBagIsEmpty,
                                style: const TextStyle(
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
                                child: Text(l10n.browseShops, style: const TextStyle(color: Colors.white)),
                              )
                            ],
                          ),
                        )
                      : ListView(
                          padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
                          children: [
                            ...cartItems.map((item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 16),
                                  child: _CartItemTile(
                                    cartItem: item,
                                    units: _units,
                                    fallbackEmoji: _getFallbackEmoji(item.item),
                                  ),
                                )),


                            _buildDeliveryScheduleCard(context, kCardBg, kBorder, kText, kSubText, kGreen),

                            const SizedBox(height: 16),

                            // Summary
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(l10n.total, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: kText)),
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
                                child: Text(
                                  l10n.proceedToCheckout,
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
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

class _CartItemTile extends StatefulWidget {
  final CartItem cartItem;
  final List<Unit> units;
  final String fallbackEmoji;

  const _CartItemTile({
    required this.cartItem,
    required this.units,
    required this.fallbackEmoji,
  });

  @override
  State<_CartItemTile> createState() => _CartItemTileState();
}

class _CartItemTileState extends State<_CartItemTile> {
  late TextEditingController _qtyController;

  @override
  void initState() {
    super.initState();
    _qtyController = TextEditingController(text: _formatQty(widget.cartItem.quantity));
  }

  @override
  void didUpdateWidget(covariant _CartItemTile oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.cartItem.quantity != widget.cartItem.quantity) {
      final formatted = _formatQty(widget.cartItem.quantity);
      if (_qtyController.text != formatted) {
        _qtyController.text = formatted;
      }
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

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final kCardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final kText = isDark ? Colors.white : const Color(0xFF1A1A1A);
    final kSubText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF555555);
    final kBorder = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    const kGreen = Color(0xFF4CD964);
    const kGreenDark = Color(0xFF1E4D1E);

    final cartItem = widget.cartItem;
    final item = cartItem.item;
    final variant = cartItem.variant;
    final config = cartItem.sellConfig;
    final sellMode = config?.sellMode ?? SellMode.packed;

    // Price calculation
    double pricePerUnit;
    String unitSymbol = '';
    if (sellMode == SellMode.manual) {
      pricePerUnit = config?.pricePerBaseUnit ?? 0.0;
      unitSymbol = widget.units.firstWhere(
        (u) => u.id == config?.baseUnitId,
        orElse: () => const Unit(id: '', name: '', symbol: 'kg', unitGroupId: '', baseMultiplier: 1.0),
      ).symbol;
    } else if (sellMode == SellMode.dynamic) {
      pricePerUnit = (config?.pricePerBaseUnit ?? 0.0) * (variant.value ?? 1.0);
    } else {
      pricePerUnit = variant.price ?? 0.0;
    }

    final lineTotal = pricePerUnit * cartItem.quantity;
    final langCode = LanguageService.instance.locale.languageCode;

    return Dismissible(
      key: ValueKey(variant.id),
      direction: DismissDirection.endToStart,
      onDismissed: (_) => CartService.instance.removeItem(variant.id),
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
          color: kCardBg,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: kBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 20,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 70, height: 70,
                  alignment: Alignment.center,
                  child: variant.imageUrl != null && variant.imageUrl!.trim().isNotEmpty
                      ? Image.network(variant.imageUrl!, fit: BoxFit.cover)
                      : item.imageUrl != null
                          ? Image.network(item.imageUrl!, fit: BoxFit.cover)
                          : Text(widget.fallbackEmoji, style: const TextStyle(fontSize: 40)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.getLocalizedName(langCode),
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: kText,
                        ),
                      ),
                      if (variant.getLocalizedLabel(langCode).isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          variant.getLocalizedLabel(langCode),
                          style: TextStyle(
                            fontSize: 12,
                            color: kSubText,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            '₹ ${lineTotal.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: kGreen,
                            ),
                          ),
                          if (sellMode == SellMode.manual && unitSymbol.isNotEmpty) ...[
                            const SizedBox(width: 4),
                            Text(
                              '(₹ ${pricePerUnit.toStringAsFixed(0)} / $unitSymbol)',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: kSubText),
                            ),
                          ]
                        ],
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => CartService.instance.removeItem(variant.id),
                  child: Container(
                    width: 28, height: 28,
                    decoration: BoxDecoration(
                      color: kCardBg,
                      shape: BoxShape.circle,
                      border: Border.all(color: kBorder),
                    ),
                    child: const Icon(Icons.delete_outline, color: Color(0xFFFF4757), size: 16),
                  ),
                ),
              ],
            ),

            // Variant Selector Chips for dynamic, portion, or multi-variant packed items
            if ((sellMode == SellMode.dynamic ||
                    sellMode == SellMode.portion ||
                    item.itemVariants.length > 1) &&
                item.itemVariants.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: item.itemVariants.map((v) {
                  final isActive = v.id == variant.id;
                  return GestureDetector(
                    onTap: () {
                      if (!isActive) {
                        CartService.instance.updateVariant(variant.id, v);
                      }
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isActive ? kGreen : kBorder,
                          width: isActive ? 1.5 : 1,
                        ),
                        color: isActive ? kGreen.withOpacity(0.15) : kCardBg,
                      ),
                      child: Text(
                        v.getLocalizedLabel(langCode).isNotEmpty
                            ? v.getLocalizedLabel(langCode)
                            : v.variantType.name,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isActive ? kGreenDark : kSubText,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],

            const SizedBox(height: 12),

            // Quantity / Weight Editing Control
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  sellMode == SellMode.manual ? 'Weight / Qty:' : 'Quantity:',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: kSubText),
                ),
                if (sellMode == SellMode.manual) ...[
                  Container(
                    height: 36,
                    width: 120,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: kGreen.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: kGreen.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _qtyController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: kGreenDark),
                            decoration: const InputDecoration(
                              contentPadding: EdgeInsets.zero,
                              isDense: true,
                              border: InputBorder.none,
                            ),
                            onChanged: (val) {
                              final parsed = double.tryParse(val) ?? 0.0;
                              if (parsed > 0) {
                                CartService.instance.updateQuantity(variant.id, parsed);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          unitSymbol,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: kGreenDark),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: kCardBg,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: kBorder),
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
                          onTap: () => CartService.instance.updateQuantity(variant.id, cartItem.quantity - 1.0),
                          child: Icon(Icons.remove, size: 18, color: kSubText),
                        ),
                        const SizedBox(width: 14),
                        Text(
                          _formatQty(cartItem.quantity),
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: kText,
                          ),
                        ),
                        const SizedBox(width: 14),
                        GestureDetector(
                          onTap: () => CartService.instance.updateQuantity(variant.id, cartItem.quantity + 1.0),
                          child: const Icon(Icons.add, size: 18, color: kGreen),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}




