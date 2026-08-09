import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class PurchaseHistoryScreen extends StatefulWidget {
  const PurchaseHistoryScreen({super.key});

  @override
  State<PurchaseHistoryScreen> createState() => _PurchaseHistoryScreenState();
}

class _PurchaseHistoryScreenState extends State<PurchaseHistoryScreen> {
  bool _isLoading = true;
  List<dynamic> _allOrders = [];
  List<dynamic> _filteredOrders = [];
  
  Map<String, dynamic> _stats = {
    'total_orders': 0,
    'total_spent': 0.0,
    'favorite_shop_name': 'N/A',
    'favorite_category_name': 'N/A'
  };

  String _dateFilter = 'all'; // 'today', 'week', 'month', 'year', 'all'
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
    _searchController.addListener(_filterData);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return;

    setState(() => _isLoading = true);

    try {
      // 1. Fetch all orders with items and categories
      final ordersResponse = await supabase
          .from('orders')
          .select('''
            id,
            order_number,
            status,
            total_final_price,
            created_at,
            payment_type,
            shops(name),
            order_items(
              id,
              requested_value,
              final_price,
              items(
                name,
                categories(name)
              )
            )
          ''')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      _allOrders = ordersResponse as List<dynamic>;

      // 2. Fetch stats from RPC (with safe fallback to local calculation)
      try {
        final statsResponse = await supabase.rpc('get_purchase_history_stats', params: {
          'p_user_id': userId,
          'p_date_filter': 'all'
        });

        if (statsResponse != null && (statsResponse as List).isNotEmpty) {
          final s = statsResponse[0];
          _stats = {
            'total_orders': (s['total_orders'] as num?)?.toInt() ?? 0,
            'total_spent': (s['total_spent'] as num?)?.toDouble() ?? 0.0,
            'favorite_shop_name': s['favorite_shop_name'] as String? ?? 'N/A',
            'favorite_category_name': s['favorite_category_name'] as String? ?? 'N/A'
          };
        } else {
          _calculateLocalStats();
        }
      } catch (e) {
        debugPrint('Stats RPC failed, using local stats fallback: $e');
        _calculateLocalStats();
      }

      _filterData();
    } catch (e) {
      debugPrint('Error fetching purchase history: $e');
      setState(() => _isLoading = false);
    }
  }

  void _calculateLocalStats() {
    final delivered = _allOrders.where((o) => o['status'] == 'delivered').toList();
    
    // Find favorite shop
    final shopCounts = <String, int>{};
    for (final o in delivered) {
      final shopName = (o['shops'] as Map<String, dynamic>?)?['name'] as String?;
      if (shopName != null) {
        shopCounts[shopName] = (shopCounts[shopName] ?? 0) + 1;
      }
    }
    String favShop = 'N/A';
    int maxShopCount = 0;
    shopCounts.forEach((shop, count) {
      if (count > maxShopCount) {
        maxShopCount = count;
        favShop = shop;
      }
    });

    // Find favorite category
    final categoryCounts = <String, int>{};
    for (final o in delivered) {
      final itemsList = o['order_items'] as List<dynamic>? ?? [];
      for (final oi in itemsList) {
        final categoryName = (oi['items']?['categories'] as Map<String, dynamic>?)?['name'] as String?;
        if (categoryName != null) {
          categoryCounts[categoryName] = (categoryCounts[categoryName] ?? 0) + 1;
        }
      }
    }
    String favCategory = 'N/A';
    int maxCatCount = 0;
    categoryCounts.forEach((cat, count) {
      if (count > maxCatCount) {
        maxCatCount = count;
        favCategory = cat;
      }
    });

    final totalSpent = delivered.fold<double>(0.0, (sum, o) => sum + ((o['total_final_price'] as num?)?.toDouble() ?? 0.0));

    setState(() {
      _stats = {
        'total_orders': delivered.length,
        'total_spent': totalSpent,
        'favorite_shop_name': favShop,
        'favorite_category_name': favCategory
      };
    });
  }

  void _filterData() {
    final query = _searchController.text.trim().toLowerCase();
    final now = DateTime.now();

    List<dynamic> result = _allOrders.where((o) {
      // 1. Date Filter
      final createdAtStr = o['created_at'] as String;
      final date = DateTime.parse(createdAtStr);
      final todayStart = DateTime(now.year, now.month, now.day);

      if (_dateFilter == 'today') {
        if (date.isBefore(todayStart)) return false;
      } else if (_dateFilter == 'week') {
        final weekAgo = now.subtract(const Duration(days: 7));
        if (date.isBefore(weekAgo)) return false;
      } else if (_dateFilter == 'month') {
        final monthAgo = DateTime(now.year, now.month - 1, now.day);
        if (date.isBefore(monthAgo)) return false;
      } else if (_dateFilter == 'year') {
        final yearAgo = DateTime(now.year - 1, now.month, now.day);
        if (date.isBefore(yearAgo)) return false;
      }

      // 2. Keyword Search (Order Number, Shop Name, Product Name)
      if (query.isNotEmpty) {
        final orderNumber = o['order_number'] != null ? o['order_number'].toString() : '';
        final orderId = o['id'] as String;
        final shopName = ((o['shops'] as Map<String, dynamic>?)?['name'] ?? '').toLowerCase();

        final matchOrderNum = orderNumber.contains(query) || orderId.substring(0, 8).contains(query);
        final matchShopName = shopName.contains(query);

        final itemsList = o['order_items'] as List<dynamic>? ?? [];
        final matchItemName = itemsList.any((oi) {
          final name = (oi['items']?['name'] as String? ?? '').toLowerCase();
          return name.contains(query);
        });

        return matchOrderNum || matchShopName || matchItemName;
      }

      return true;
    }).toList();

    setState(() {
      _filteredOrders = result;
      _isLoading = false;
    });
  }

  Future<void> _exportCSV() async {
    final l10n = AppLocalizations.of(context)!;
    if (_filteredOrders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.noOrdersToExport)),
      );
      return;
    }

    final headers = ['Order Number', 'Date', 'Shop Name', 'Items Summary', 'Total Price (INR)', 'Status', 'Payment Type'];
    final rows = _filteredOrders.map((o) {
      final orderNumber = o['order_number'] != null ? o['order_number'].toString() : o['id'].toString().substring(0, 8);
      final dateStr = DateFormat('yyyy-MM-dd').format(DateTime.parse(o['created_at'] as String));
      final shopName = (o['shops'] as Map<String, dynamic>?)?['name'] ?? 'Unknown';
      
      final itemsList = o['order_items'] as List<dynamic>? ?? [];
      final itemsStr = itemsList.map((oi) {
        final name = oi['items']?['name'] ?? 'Item';
        final qty = oi['requested_value'] ?? 1;
        return '$name (x$qty)';
      }).join('; ');

      final price = (o['total_final_price'] as num?)?.toDouble() ?? 0.0;
      final status = o['status'] as String? ?? '';
      final paymentType = o['payment_type'] as String? ?? 'COD';

      return [
        orderNumber,
        dateStr,
        shopName,
        itemsStr,
        price.toStringAsFixed(2),
        status,
        paymentType
      ];
    });

    final csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => '"${val.replaceAll('"', '""')}"').join(','))
    ].join('\n');

    await Clipboard.setData(ClipboardData(text: csvContent));

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.csvCopiedSuccess),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  Future<void> _exportReport() async {
    final l10n = AppLocalizations.of(context)!;
    if (_filteredOrders.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.noOrdersToExport)),
      );
      return;
    }

    final buffer = StringBuffer();
    buffer.writeln('========================================');
    buffer.writeln('       ANGADI PURCHASE HISTORY  ');
    buffer.writeln('       Report Generated: ${DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now())}');
    buffer.writeln('========================================\n');
    buffer.writeln('STATS SUMMARY:');
    buffer.writeln('Total Orders: ${_stats['total_orders']}');
    buffer.writeln('Total Spent: ₹${(_stats['total_spent'] as double).toStringAsFixed(2)}');
    buffer.writeln('Favorite Shop: ${_stats['favorite_shop_name']}');
    buffer.writeln('Favorite Category: ${_stats['favorite_category_name']}\n');
    buffer.writeln('ORDER DETAILS:');
    buffer.writeln('----------------------------------------');

    for (final o in _filteredOrders) {
      final orderNumber = o['order_number'] != null ? o['order_number'].toString() : o['id'].toString().substring(0, 8);
      final dateStr = DateFormat('yyyy-MM-dd HH:mm').format(DateTime.parse(o['created_at'] as String));
      final shopName = (o['shops'] as Map<String, dynamic>?)?['name'] ?? 'Unknown';
      final status = (o['status'] as String).toUpperCase();
      final price = (o['total_final_price'] as num?)?.toDouble() ?? 0.0;
      final payment = (o['payment_type'] as String? ?? 'COD').toUpperCase();

      buffer.writeln('Order #$orderNumber | Date: $dateStr');
      buffer.writeln('Shop: $shopName | Status: $status | Payment: $payment');
      buffer.writeln('Items:');
      
      final itemsList = o['order_items'] as List<dynamic>? ?? [];
      for (final oi in itemsList) {
        final name = oi['items']?['name'] ?? 'Item';
        final qty = oi['requested_value'] ?? 1;
        final finalPrice = (oi['final_price'] as num?)?.toDouble() ?? 0.0;
        buffer.writeln('  - $name x$qty (₹${finalPrice.toStringAsFixed(0)})');
      }
      buffer.writeln('Total: ₹${price.toStringAsFixed(2)}');
      buffer.writeln('----------------------------------------');
    }

    await Clipboard.setData(ClipboardData(text: buffer.toString()));

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.reportCopiedSuccess),
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  String _formatDate(String dateStr) {
    final d = DateTime.parse(dateStr).toLocal();
    return DateFormat('d MMM yyyy').format(d);
  }

  Color _getStatusColor(String status, bool isDark) {
    switch (status.toLowerCase()) {
      case 'delivered':
        return const Color(0xFF22C55E);
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'cancelled':
        return const Color(0xFFEF4444);
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;

    // Local Stats calculation based on active filtered orders
    final deliveredOrders = _filteredOrders.where((o) => o['status'] == 'delivered').toList();
    final localSpent = deliveredOrders.fold<double>(0.0, (sum, o) => sum + ((o['total_final_price'] as num?)?.toDouble() ?? 0.0));

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
          l10n.purchaseHistoryLabel,
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
          // ── Stats Dashboard Grid ───────────────────────────────────────────
          if (!_isLoading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              child: GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.8,
                children: [
                  _buildStatCard('Total Orders', deliveredOrders.length.toString(), HugeIcons.strokeRoundedShoppingBag01, isDark),
                  _buildStatCard('Total Spent', '₹${localSpent.toStringAsFixed(0)}', HugeIcons.strokeRoundedChartIncrease, isDark),
                  _buildStatCard('Favorite Shop', _stats['favorite_shop_name'], HugeIcons.strokeRoundedStore01, isDark),
                  _buildStatCard('Fav Category', _stats['favorite_category_name'], HugeIcons.strokeRoundedTag01, isDark),
                ],
              ),
            ),

          // ── Search Input ───────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
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
                  hintText: l10n.searchHistoryPlaceholder,
                  hintStyle: TextStyle(color: isDark ? kNeutral500 : kNeutral400),
                  prefixIcon: Icon(Icons.search, color: isDark ? kNeutral500 : kNeutral400),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ),

          // ── Filters Toolbar & Export ───────────────────────────────────────
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 36,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      children: [
                        _buildFilterChip(l10n.todayLabel, 'today', isDark),
                        _buildFilterChip(l10n.last7DaysLabel, 'week', isDark),
                        _buildFilterChip(l10n.last30DaysLabel, 'month', isDark),
                        _buildFilterChip(l10n.allTimeLabel, 'year', isDark),
                        _buildFilterChip(l10n.allTimeLabel, 'all', isDark),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                GestureDetector(
                  onTap: _exportCSV,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? kNeutral800 : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        HugeIcon(icon: HugeIcons.strokeRoundedDownload01, size: 14, color: isDark ? Colors.white : kNeutral900),
                        const SizedBox(width: 4),
                        Text(l10n.csvButtonLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isDark ? Colors.white : kNeutral900)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                GestureDetector(
                  onTap: _exportReport,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? kNeutral800 : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        HugeIcon(icon: HugeIcons.strokeRoundedPrinter, size: 14, color: isDark ? Colors.white : kNeutral900),
                        const SizedBox(width: 4),
                        Text(l10n.reportButtonLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isDark ? Colors.white : kNeutral900)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── List Area ──────────────────────────────────────────────────────
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator(color: kWaGreenDark))
                : _filteredOrders.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            HugeIcon(icon: HugeIcons.strokeRoundedShoppingBag01, size: 64, color: isDark ? kNeutral600 : kNeutral400),
                            const SizedBox(height: 16),
                            Text(
                              l10n.noHistoryFound,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: isDark ? Colors.white : kNeutral900,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              l10n.noHistorySubtitle,
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark ? kNeutral400 : kNeutral600,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        itemCount: _filteredOrders.length,
                        itemBuilder: (context, index) {
                          final o = _filteredOrders[index];
                          final id = o['id'] as String;
                          final orderNumber = o['order_number'] != null ? '#${o['order_number']}' : '#${id.substring(0, 8)}';
                          final shopName = (o['shops'] as Map<String, dynamic>?)?['name'] as String? ?? 'Angadi Shop';
                          final dateStr = o['created_at'] as String;
                          final status = o['status'] as String? ?? 'pending';
                          final price = (o['total_final_price'] as num?)?.toDouble() ?? 0.0;
                          
                          final itemsList = o['order_items'] as List<dynamic>? ?? [];
                          final itemsPreview = itemsList.map((oi) {
                            final name = oi['items']?['name'] ?? 'Item';
                            final qty = oi['requested_value'] ?? 1;
                            return '$name (x$qty)';
                          }).join(', ');

                          final statusColor = _getStatusColor(status, isDark);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: isDark ? kNeutral800 : Colors.white,
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.02),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                )
                              ],
                            ),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () => context.push('/orders/$id'),
                                borderRadius: BorderRadius.circular(24),
                                child: Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Meta Row
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            orderNumber,
                                            style: TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w800,
                                              color: isDark ? Colors.white : kNeutral900,
                                            ),
                                          ),
                                          Text(
                                            _formatDate(dateStr),
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: isDark ? kNeutral400 : kNeutral500,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const Padding(
                                        padding: EdgeInsets.symmetric(vertical: 10),
                                        child: Divider(height: 1),
                                      ),
                                      // Shop & Status Row
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Text(
                                              shopName,
                                              style: TextStyle(
                                                fontSize: 16,
                                                fontWeight: FontWeight.w800,
                                                color: isDark ? Colors.white : kNeutral900,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: statusColor.withOpacity(0.1),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              status.toUpperCase(),
                                              style: TextStyle(
                                                color: statusColor,
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      // Items preview
                                      Text(
                                        itemsPreview,
                                        style: TextStyle(
                                          fontSize: 13,
                                          color: isDark ? kNeutral400 : kNeutral500,
                                          fontWeight: FontWeight.w500,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 12),
                                      // Total & Details Row
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                l10n.totalLabel,
                                                style: TextStyle(
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.bold,
                                                  color: isDark ? kNeutral500 : kNeutral400,
                                                ),
                                              ),
                                              Text(
                                                '₹${price.toStringAsFixed(2)}',
                                                style: TextStyle(
                                                  fontSize: 18,
                                                  fontWeight: FontWeight.w900,
                                                  color: isDark ? Colors.white : kNeutral900,
                                                ),
                                              ),
                                            ],
                                          ),
                                          Row(
                                            children: [
                                              Text(
                                                l10n.viewDetailsButton,
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.bold,
                                                  color: kWaGreenDark,
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                              Icon(Icons.chevron_right, size: 18, color: kWaGreenDark),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
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

  Widget _buildStatCard(String label, String value, List<List<dynamic>> icon, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? kNeutral800 : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: isDark ? kNeutral400 : kNeutral500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              HugeIcon(icon: icon, size: 14, color: kWaGreenDark),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : kNeutral900,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, bool isDark) {
    final active = _dateFilter == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _dateFilter = value;
          _filterData();
        });
      },
      child: Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: active
              ? (isDark ? const Color(0x334CD964) : const Color(0xFFECFDF5))
              : (isDark ? kNeutral800 : Colors.white),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: active ? kWaGreen : (isDark ? kNeutral700 : kNeutral200),
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: active ? kWaGreenDark : (isDark ? kNeutral400 : kNeutral600),
            ),
          ),
        ),
      ),
    );
  }
}
