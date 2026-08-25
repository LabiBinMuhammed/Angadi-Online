import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../core/cart_service.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';
import '../../../widgets/tutorial/tutorial_manager.dart';

class RecentPurchasesScreen extends StatefulWidget {
  const RecentPurchasesScreen({super.key});

  @override
  State<RecentPurchasesScreen> createState() => _RecentPurchasesScreenState();
}

class _RecentPurchasesScreenState extends State<RecentPurchasesScreen> {
  bool _isLoading = true;
  List<dynamic> _allPurchases = [];
  List<dynamic> _filteredPurchases = [];
  
  String _daysFilter = '90'; // '7', '30', '90', 'all'
  String _sortBy = 'recent'; // 'recent', 'ordered'
  final TextEditingController _searchController = TextEditingController();
  final Map<String, bool> _addingToCart = {};

  @override
  void initState() {
    super.initState();
    _fetchPurchases();
    _searchController.addListener(_filterAndSort);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchPurchases() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return;

    setState(() => _isLoading = true);

    try {
      // Fetch maximum days first, filter client-side for immediate response
      final response = await supabase.rpc('get_recent_purchases', params: {
        'p_user_id': userId,
        'p_days': 3650, // Fetch up to 10 years to allow client-side 'All' filter
        'p_limit': 100
      });

      _allPurchases = response as List<dynamic>;
      _filterAndSort();
    } catch (e) {
      debugPrint('Error invoking get_recent_purchases: $e');
      setState(() => _isLoading = false);
    }
  }

  void _filterAndSort() {
    final query = _searchController.text.trim().toLowerCase();
    
    // 1. Date Filter
    List<dynamic> result = _allPurchases.where((item) {
      if (_daysFilter != 'all') {
        final limitDays = int.parse(_daysFilter);
        final dateStr = item['last_purchased_date'] as String;
        final purchaseDate = DateTime.parse(dateStr);
        final cutoffDate = DateTime.now().subtract(Duration(days: limitDays));
        if (purchaseDate.isBefore(cutoffDate)) return false;
      }
      return true;
    }).toList();

    // 2. Keyword Search (Product or Shop Name)
    if (query.isNotEmpty) {
      result = result.where((item) {
        final productName = (item['product_name'] as String? ?? '').toLowerCase();
        final shopName = (item['shop_name'] as String? ?? '').toLowerCase();
        return productName.contains(query) || shopName.contains(query);
      }).toList();
    }

    // 3. Sorting
    result.sort((a, b) {
      if (_sortBy == 'ordered') {
        final countA = (a['total_ordered_count'] as num?)?.toInt() ?? 0;
        final countB = (b['total_ordered_count'] as num?)?.toInt() ?? 0;
        return countB.compareTo(countA);
      } else {
        final dateA = DateTime.parse(a['last_purchased_date'] as String);
        final dateB = DateTime.parse(b['last_purchased_date'] as String);
        return dateB.compareTo(dateA);
      }
    });

    setState(() {
      _filteredPurchases = result;
      _isLoading = false;
    });
  }

  Future<void> _reorderItem(dynamic item) async {
    final l10n = AppLocalizations.of(context)!;
    final itemId = item['item_id'] as String;
    final productName = item['product_name'] as String;
    final variantId = item['last_variant_id'] as String?;
    final isActive = item['is_active'] as bool? ?? true;
    final status = item['item_status'] as String? ?? 'ready';

    if (!isActive || status == 'out_of_stock') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.outOfStockMessage(productName))),
      );
      return;
    }

    setState(() => _addingToCart[itemId] = true);

    try {
      await CartService.instance.addItemById(itemId, variantId: variantId);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.addedToCartMessage(productName))),
        );
        TutorialManager.instance.triggerBagTutorial(context);
      }
    } catch (e) {
      debugPrint('Error reordering item: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.failedToAddToCart)),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _addingToCart[itemId] = false);
      }
    }
  }

  String _formatDate(String dateStr) {
    final d = DateTime.parse(dateStr);
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: isDark ? Colors.white : kNeutral900, size: 20),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/profile');
            }
          },
        ),
        title: Text(
          l10n.recentPurchasesLabel,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : kNeutral900,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // ── Search Bar ─────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? kNeutral800 : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
              ),
              child: TextField(
                controller: _searchController,
                style: TextStyle(color: isDark ? Colors.white : kNeutral900),
                decoration: InputDecoration(
                  hintText: l10n.searchPurchasesPlaceholder,
                  hintStyle: TextStyle(color: isDark ? kNeutral500 : kNeutral400),
                  prefixIcon: Icon(Icons.search, color: isDark ? kNeutral500 : kNeutral400),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ),

          // ── Date Filters Row ───────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _buildFilterChip(l10n.sevenDaysFilter, '7', isDark),
                  _buildFilterChip(l10n.thirtyDaysFilter, '30', isDark),
                  _buildFilterChip(l10n.ninetyDaysFilter, '90', isDark),
                  _buildFilterChip(l10n.allTimeLabel, 'all', isDark),
                ],
              ),
            ),
          ),

          // ── Sort Row ───────────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 8),
            child: Row(
              children: [
                _buildSortButton(l10n.mostRecentSort, 'recent', isDark),
                const SizedBox(width: 8),
                _buildSortButton(l10n.mostOrderedSort, 'ordered', isDark),
              ],
            ),
          ),

          // ── List Area ──────────────────────────────────────────────────────
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator(color: kWaGreenDark))
                : _filteredPurchases.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            HugeIcon(icon: HugeIcons.strokeRoundedClock01, size: 64, color: isDark ? kNeutral600 : kNeutral400),
                            const SizedBox(height: 16),
                            Text(
                              l10n.noRecentPurchases,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white : kNeutral900,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              l10n.noRecentPurchasesSubtitle,
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark ? kNeutral400 : kNeutral600,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(20),
                        itemCount: _filteredPurchases.length,
                        itemBuilder: (context, index) {
                          final item = _filteredPurchases[index];
                          final itemId = item['item_id'] as String;
                          final productName = item['product_name'] as String;
                          final shopName = item['shop_name'] as String;
                          final dateStr = item['last_purchased_date'] as String;
                          final qty = (item['last_purchased_qty'] as num?)?.toDouble() ?? 1.0;
                          final price = (item['last_purchased_price'] as num?)?.toDouble() ?? 0.0;
                          final orderCount = (item['total_ordered_count'] as num?)?.toInt() ?? 1;
                          final imageUrl = item['image_url'] as String?;
                          final isActive = item['is_active'] as bool? ?? true;
                          final status = item['item_status'] as String? ?? 'ready';
                          final isAvailable = isActive && status != 'out_of_stock';
                          final isAdding = _addingToCart[itemId] ?? false;

                          return Opacity(
                            opacity: isAvailable ? 1.0 : 0.6,
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: isDark ? kNeutral800 : Colors.white,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 65,
                                    height: 65,
                                    decoration: BoxDecoration(
                                      color: isDark ? kNeutral700 : kNeutral200,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: imageUrl != null && imageUrl.isNotEmpty
                                        ? ClipRRect(
                                            borderRadius: BorderRadius.circular(16),
                                            child: Image.network(imageUrl, fit: BoxFit.cover),
                                          )
                                        : Center(
                                            child: Text(
                                              productName[0].toUpperCase(),
                                              style: TextStyle(
                                                fontSize: 20,
                                                fontWeight: FontWeight.bold,
                                                color: isDark ? Colors.white70 : kNeutral700,
                                              ),
                                            ),
                                          ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          productName,
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                            color: isDark ? Colors.white : kNeutral900,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          shopName,
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: isDark ? kNeutral400 : kNeutral600,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: isDark ? kNeutral700 : kNeutral100,
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                'Last: ${_formatDate(dateStr)}',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w500,
                                                  color: isDark ? kNeutral400 : kNeutral600,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: isDark ? kNeutral700 : kNeutral100,
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Text(
                                                'x$orderCount Orders',
                                                style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w500,
                                                  color: isDark ? kNeutral400 : kNeutral600,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '₹${price.toStringAsFixed(0)}',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                          color: isDark ? Colors.white : kNeutral900,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      SizedBox(
                                        height: 32,
                                        child: ElevatedButton(
                                          onPressed: isAvailable && !isAdding ? () => _reorderItem(item) : null,
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: kWaGreen,
                                            foregroundColor: Colors.white,
                                            disabledBackgroundColor: isDark ? kNeutral700 : kNeutral200,
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            padding: const EdgeInsets.symmetric(horizontal: 10),
                                            elevation: 0,
                                          ),
                                          child: isAdding
                                              ? const SizedBox(
                                                  width: 14,
                                                  height: 14,
                                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                                )
                                              : Text(
                                                  isAvailable ? l10n.reorderButton : l10n.outOfStockLabel,
                                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                                ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, bool isDark) {
    final active = _daysFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _daysFilter = value;
          _filterAndSort();
        });
      },
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active
              ? (isDark ? const Color(0x334CD964) : const Color(0xFFECFDF5))
              : (isDark ? kNeutral800 : Colors.white),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? kWaGreen : (isDark ? kNeutral700 : kNeutral200),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: active
                ? kWaGreenDark
                : (isDark ? kNeutral400 : kNeutral600),
          ),
        ),
      ),
    );
  }

  Widget _buildSortButton(String label, String value, bool isDark) {
    final active = _sortBy == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _sortBy = value;
          _filterAndSort();
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: active
              ? (isDark ? const Color(0x334CD964) : const Color(0xFFECFDF5))
              : (isDark ? kNeutral800 : Colors.white),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: active ? kWaGreen : (isDark ? kNeutral700 : kNeutral200),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: active
                ? kWaGreenDark
                : (isDark ? kNeutral400 : kNeutral600),
          ),
        ),
      ),
    );
  }
}
