import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/theme_service.dart';

class _BillingPageData {
  final List<Map<String, dynamic>> billingItems;
  final List<Map<String, dynamic>> locations;
  _BillingPageData({required this.billingItems, required this.locations});
}

class AdminShopsBillingScreen extends StatefulWidget {
  const AdminShopsBillingScreen({super.key});

  @override
  State<AdminShopsBillingScreen> createState() => _AdminShopsBillingScreenState();
}

class _AdminShopsBillingScreenState extends State<AdminShopsBillingScreen> {
  late Future<_BillingPageData> _future;
  bool _loading = false;
  String? _selectedLocationId;
  final _searchCtrl = TextEditingController();
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;

  final List<int> _years = List.generate(6, (i) => 2025 + i);
  final List<Map<String, dynamic>> _months = [
    {'value': 1, 'name': 'January'},
    {'value': 2, 'name': 'February'},
    {'value': 3, 'name': 'March'},
    {'value': 4, 'name': 'April'},
    {'value': 5, 'name': 'May'},
    {'value': 6, 'name': 'June'},
    {'value': 7, 'name': 'July'},
    {'value': 8, 'name': 'August'},
    {'value': 9, 'name': 'September'},
    {'value': 10, 'name': 'October'},
    {'value': 11, 'name': 'November'},
    {'value': 12, 'name': 'December'},
  ];

  @override
  void initState() {
    super.initState();
    _future = _fetchShopsBillingData();
    _searchCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _refresh() {
    setState(() {
      _future = _fetchShopsBillingData();
    });
  }

  Future<_BillingPageData> _fetchShopsBillingData() async {
    // 1. Fetch all locations
    final locsRes = await supabase.from('locations').select('id, name').order('name');
    final locations = (locsRes as List).cast<Map<String, dynamic>>();

    // 2. Fetch all shops with subscriptions and locations
    final shopsRes = await supabase
        .from('shops')
        .select('id, name, location_id, created_at, shop_subscription(trial_start_date, trial_end_date, is_trial_active, commission_rate, commission_enabled)')
        .order('name');
    final shopsList = (shopsRes as List).cast<Map<String, dynamic>>();

    final startDate = DateTime(_selectedYear, _selectedMonth, 1).toUtc().toIso8601String();
    // For December, wrap to next year January
    final nextMonth = _selectedMonth == 12 ? 1 : _selectedMonth + 1;
    final nextYear = _selectedMonth == 12 ? _selectedYear + 1 : _selectedYear;
    final endDate = DateTime(nextYear, nextMonth, 1).toUtc().toIso8601String();

    // 3. Fetch delivered orders for the month
    final ordersRes = await supabase
        .from('orders')
        .select('shop_id, total_final_price')
        .eq('status', 'delivered')
        .gte('created_at', startDate)
        .lt('created_at', endDate);
    final ordersList = (ordersRes as List).cast<Map<String, dynamic>>();

    // 4. Fetch commission transactions for the month
    final txsRes = await supabase
        .from('commission_transactions')
        .select('shop_id, commission_amount')
        .gte('generated_at', startDate)
        .lt('generated_at', endDate);
    final txsList = (txsRes as List).cast<Map<String, dynamic>>();

    // 5. Fetch existing reports for status
    final reportsRes = await supabase
        .from('monthly_commission_reports')
        .select('shop_id, payment_status, total_sales, total_commission')
        .eq('month', _selectedMonth)
        .eq('year', _selectedYear);
    final reportsList = (reportsRes as List).cast<Map<String, dynamic>>();

    // 6. Combine data
    final billingItems = shopsList.map((shop) {
      final sub = shop['shop_subscription'] is List
          ? (shop['shop_subscription'] as List).firstOrNull as Map?
          : shop['shop_subscription'] as Map?;

      final shopId = shop['id'] as String;

      // Filter orders
      final shopOrders = ordersList.where((o) => o['shop_id'] == shopId);
      final calculatedSales = shopOrders.fold<double>(0.0, (sum, o) => sum + (o['total_final_price'] ?? 0).toDouble());
      final totalOrdersCount = shopOrders.length;

      // Filter transactions
      final shopTxs = txsList.where((t) => t['shop_id'] == shopId);
      final calculatedCommission = shopTxs.fold<double>(0.0, (sum, t) => sum + (t['commission_amount'] ?? 0).toDouble());

      // Find report
      final report = reportsList.firstWhere((r) => r['shop_id'] == shopId, orElse: () => {});

      final totalSales = report['total_sales'] != null ? (report['total_sales'] as num).toDouble() : calculatedSales;
      final totalCommission = report['total_commission'] != null ? (report['total_commission'] as num).toDouble() : calculatedCommission;
      final paymentStatus = report['payment_status'] as String? ?? 'pending';

      return {
        'id': shopId,
        'name': shop['name'] as String,
        'locationId': shop['location_id'] as String?,
        'isTrialActive': sub?['is_trial_active'] as bool? ?? false,
        'commissionRate': sub != null && sub['commission_rate'] != null ? (sub['commission_rate'] as num).toDouble() : 5.0,
        'totalOrders': totalOrdersCount,
        'totalSales': totalSales,
        'totalCommission': totalCommission,
        'paymentStatus': paymentStatus,
      };
    }).toList();

    return _BillingPageData(
      billingItems: billingItems,
      locations: locations,
    );
  }

  Future<void> _togglePaymentStatus(Map<String, dynamic> shop) async {
    setState(() => _loading = true);
    try {
      final currentStatus = shop['paymentStatus'] as String;
      final targetStatus = currentStatus == 'paid' ? 'pending' : 'paid';
      final totalCommission = shop['totalCommission'] as double;
      final totalSales = shop['totalSales'] as double;

      final startDate = DateTime(_selectedYear, _selectedMonth, 1).toUtc().toIso8601String();
      final nextMonth = _selectedMonth == 12 ? 1 : _selectedMonth + 1;
      final nextYear = _selectedMonth == 12 ? _selectedYear + 1 : _selectedYear;
      final endDate = DateTime(nextYear, nextMonth, 1).toUtc().toIso8601String();

      // Check if report exists
      final reportRes = await supabase
          .from('monthly_commission_reports')
          .select('id')
          .eq('shop_id', shop['id'])
          .eq('month', _selectedMonth)
          .eq('year', _selectedYear)
          .maybeSingle();

      final amountPaid = targetStatus == 'paid' ? totalCommission : 0.0;
      final balanceDue = targetStatus == 'paid' ? 0.0 : totalCommission;

      if (reportRes != null) {
        await supabase.from('monthly_commission_reports').update({
          'total_orders': shop['totalOrders'] ?? 0,
          'total_sales': totalSales,
          'total_commission': totalCommission,
          'amount_paid': amountPaid,
          'balance_due': balanceDue,
          'payment_status': targetStatus,
        }).eq('id', reportRes['id']);
      } else {
        await supabase.from('monthly_commission_reports').insert({
          'shop_id': shop['id'],
          'month': _selectedMonth,
          'year': _selectedYear,
          'total_orders': shop['totalOrders'] ?? 0,
          'total_sales': totalSales,
          'commission_rate': shop['commissionRate'] ?? 5.0,
          'total_commission': totalCommission,
          'amount_paid': amountPaid,
          'balance_due': balanceDue,
          'payment_status': targetStatus,
        });
      }

      // Update transactions status
      final transStatus = targetStatus == 'paid' ? 'paid' : 'pending';
      await supabase
          .from('commission_transactions')
          .update({'commission_status': transStatus})
          .eq('shop_id', shop['id'])
          .gte('generated_at', startDate)
          .lt('generated_at', endDate);

      // Log to audit log
      final session = supabase.auth.currentSession;
      await supabase.from('commission_audit_logs').insert({
        'action': 'Monthly Commission Status Toggled',
        'shop_id': shop['id'],
        'admin_user_id': session?.user.id,
        'previous_value': currentStatus,
        'new_value': targetStatus,
        'notes': 'Toggled payment status for month $_selectedMonth/$_selectedYear to $targetStatus on mobile',
      });

      // Synchronize restrictions
      await _syncRestrictionsForShop(shop['id'] as String);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Shop ${shop['name']} marked as ${targetStatus.toUpperCase()}')),
        );
        _refresh();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _syncRestrictionsForShop(String shopId) async {
    try {
      final settingsRes = await supabase.from('commission_settings').select('*').eq('id', 1).maybeSingle();
      final settings = settingsRes as Map?;
      final warningDays = settings?['grace_period_warning'] ?? 15;
      final restrictionDays = settings?['grace_period_restriction'] ?? 20;
      final blockDays = settings?['grace_period_block'] ?? 30;

      final reportsRes = await supabase
          .from('monthly_commission_reports')
          .select('*')
          .eq('shop_id', shopId)
          .neq('payment_status', 'paid');
          
      final reports = (reportsRes as List).cast<Map<String, dynamic>>();
      
      int maxOverdueDays = 0;
      for (final r in reports) {
        final genDate = DateTime.parse(r['generated_at']);
        final overdueDays = DateTime.now().difference(genDate).inDays;
        if (overdueDays > maxOverdueDays) {
          maxOverdueDays = overdueDays;
        }
      }

      int targetLevel = 0;
      if (maxOverdueDays >= blockDays) {
        targetLevel = 3;
      } else if (maxOverdueDays >= restrictionDays) {
        targetLevel = 2;
      } else if (maxOverdueDays >= warningDays) {
        targetLevel = 1;
      }

      await supabase
          .from('shop_subscription')
          .update({'restriction_level': targetLevel})
          .eq('shop_id', shopId);
    } catch (e) {
      // Quiet fail or log
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final kBg = isDark ? const Color(0xFF09090B) : const Color(0xFFF8FAFC);
    final kText = isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
    final kSubText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
    final kDivider = isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0);

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kText,
        title: const Text('Shop Billing Data', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: kText, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
        actions: [
          IconButton(
            icon: _loading 
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF8B5CF6)))
                : const HugeIcon(icon: HugeIcons.strokeRoundedRefresh01, size: 20),
            onPressed: _loading ? null : _refresh,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Filter section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Column(
              children: [
                // Date selectors
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF18181B) : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: kDivider),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<int>(
                            value: _selectedMonth,
                            dropdownColor: isDark ? const Color(0xFF18181B) : Colors.white,
                            items: _months.map((m) {
                              return DropdownMenuItem<int>(
                                value: m['value'] as int,
                                child: Text(m['name'] as String, style: TextStyle(color: kText, fontSize: 13)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _selectedMonth = val;
                                  _future = _fetchShopsBillingData();
                                });
                              }
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF18181B) : Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: kDivider),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<int>(
                            value: _selectedYear,
                            dropdownColor: isDark ? const Color(0xFF18181B) : Colors.white,
                            items: _years.map((y) {
                              return DropdownMenuItem<int>(
                                value: y,
                                child: Text(y.toString(), style: TextStyle(color: kText, fontSize: 13)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() {
                                  _selectedYear = val;
                                  _future = _fetchShopsBillingData();
                                });
                              }
                            },
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                
                // Location selector dropdown
                FutureBuilder<_BillingPageData>(
                  future: _future,
                  builder: (context, snap) {
                    final locations = snap.data?.locations ?? [];
                    return Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF18181B) : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kDivider),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String?>(
                          value: _selectedLocationId,
                          dropdownColor: isDark ? const Color(0xFF18181B) : Colors.white,
                          isExpanded: true,
                          hint: Text('Select Location', style: TextStyle(color: kSubText, fontSize: 13)),
                          items: [
                            DropdownMenuItem<String?>(
                              value: null,
                              child: Text('All Locations', style: TextStyle(color: kText, fontSize: 13)),
                            ),
                            ...locations.map((loc) {
                              return DropdownMenuItem<String?>(
                                value: loc['id'] as String,
                                child: Text(loc['name'] as String, style: TextStyle(color: kText, fontSize: 13)),
                              );
                            }),
                          ],
                          onChanged: (val) {
                            setState(() {
                              _selectedLocationId = val;
                            });
                          },
                        ),
                      ),
                    );
                  },
                ),
                const SizedBox(height: 12),
                
                // Search field
                TextField(
                  controller: _searchCtrl,
                  style: TextStyle(color: kText, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Search shop name...',
                    hintStyle: TextStyle(color: kSubText.withValues(alpha: 0.6)),
                    prefixIcon: HugeIcon(icon: HugeIcons.strokeRoundedSearch01, color: kSubText, size: 18),
                    filled: true,
                    fillColor: isDark ? const Color(0xFF18181B) : Colors.white,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: kDivider)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: const Color(0xFF8B5CF6))),
                  ),
                ),
              ],
            ),
          ),

          // List results
          Expanded(
            child: FutureBuilder<_BillingPageData>(
              future: _future,
              builder: (context, snap) {
                if (snap.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)));
                }

                if (snap.hasError) {
                  return Center(child: Text('Error loading billing data: ${snap.error}', style: TextStyle(color: kSubText)));
                }

                final data = snap.data;
                final billingData = data?.billingItems ?? [];
                final query = _searchCtrl.text.toLowerCase();
                
                final filtered = billingData.where((s) {
                  final matchQuery = s['name'].toString().toLowerCase().contains(query);
                  final matchLoc = _selectedLocationId == null ? true : s['locationId'] == _selectedLocationId;
                  return matchQuery && matchLoc;
                }).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        HugeIcon(icon: HugeIcons.strokeRoundedAlertCircle, size: 36, color: kSubText.withValues(alpha: 0.5)),
                        const SizedBox(height: 12),
                        Text('No billing records found', style: TextStyle(color: kSubText, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => _refresh(),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    itemCount: filtered.length,
                    itemBuilder: (context, i) {
                      final item = filtered[i];
                      final isPaid = item['paymentStatus'] == 'paid';
                      final isTrial = item['isTrialActive'] as bool;
                      final double sales = item['totalSales'];
                      final double commission = item['totalCommission'];

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF18181B) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: kDivider),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    item['name'],
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: kText),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isTrial ? const Color(0x264F46E5) : const Color(0x2664748B),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    isTrial ? 'Trial' : 'Active',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: isTrial ? const Color(0xFF4F46E5) : kSubText,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Sales', style: TextStyle(color: kSubText, fontSize: 11)),
                                    const SizedBox(height: 2),
                                    Text('₹${sales.toStringAsFixed(2)}', style: TextStyle(color: kText, fontWeight: FontWeight.bold, fontSize: 14)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Commission', style: TextStyle(color: kSubText, fontSize: 11)),
                                    const SizedBox(height: 2),
                                    Text('₹${commission.toStringAsFixed(2)}', style: TextStyle(color: commission > 0 ? const Color(0xFFEF4444) : kText, fontWeight: FontWeight.bold, fontSize: 14)),
                                  ],
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text('Status', style: TextStyle(color: kSubText, fontSize: 11)),
                                    const SizedBox(height: 2),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: isPaid ? const Color(0x2610B981) : const Color(0x26FBBF24),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        isPaid ? 'Paid' : 'Pending',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: isPaid ? const Color(0xFF10B981) : const Color(0xFFD97706),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            const Divider(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                OutlinedButton.icon(
                                  onPressed: _loading ? null : () => _togglePaymentStatus(item),
                                  icon: _loading 
                                      ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF8B5CF6)))
                                      : HugeIcon(
                                          icon: isPaid 
                                              ? HugeIcons.strokeRoundedAlertCircle 
                                              : HugeIcons.strokeRoundedCheckmarkCircle02, 
                                          size: 14,
                                          color: isPaid ? const Color(0xFFD97706) : const Color(0xFF10B981),
                                        ),
                                  label: Text(
                                    isPaid ? 'Mark Pending' : 'Mark Paid',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    side: BorderSide(color: isPaid ? const Color(0xFFD97706) : const Color(0xFF10B981)),
                                    foregroundColor: isPaid ? const Color(0xFFD97706) : const Color(0xFF10B981),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  ),
                                ),
                              ],
                            )
                          ],
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
