import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/supabase_client.dart';
import '../../theme/app_theme.dart';
import '../../theme/theme_service.dart';
import 'vendor_theme_helper.dart';
import 'vendor_drawer.dart';

class VendorCommissionScreen extends StatefulWidget {
  const VendorCommissionScreen({super.key});

  @override
  State<VendorCommissionScreen> createState() => _VendorCommissionScreenState();
}

class _VendorCommissionScreenState extends State<VendorCommissionScreen> {
  String? _selectedShopId;
  late Future<_Data> _future;
  int? _selectedMonth;
  int? _selectedYear;

  @override
  void initState() {
    super.initState();
    _future = _fetchData(null);
  }

  Future<_Data> _fetchData(String? shopId) async {
    final user = supabase.auth.currentUser;
    if (user == null) {
      return _Data(shops: [], selectedShopId: null);
    }
    final uid = user.id;

    try {
      // Get shops owned by this user
      final ownedShopsRes = await supabase
          .from('shop_owners')
          .select('shop_id, shops(id, name, type)')
          .eq('user_id', uid);

      final shops = (ownedShopsRes as List).map((o) {
        final s = o['shops'] as Map?;
        if (s == null) return null;
        return _Shop(id: s['id'] as String, name: s['name'] as String);
      }).whereType<_Shop>().toList();

      if (shops.isEmpty) {
        return _Data(shops: [], selectedShopId: null);
      }

      final activeShopId = shopId ?? _selectedShopId ?? shops.first.id;

      // Fetch subscription, reports, payments, and delivered orders
      final results = await Future.wait([
        supabase.from('shop_subscription').select('*').eq('shop_id', activeShopId).maybeSingle(),
        supabase.from('monthly_commission_reports').select('*').eq('shop_id', activeShopId).order('year', ascending: false).order('month', ascending: false),
        supabase.from('commission_payments').select('amount, paid_at').eq('shop_id', activeShopId),
        supabase.from('orders').select('total_final_price, created_at').eq('shop_id', activeShopId).eq('status', 'delivered'),
      ]);

      final sub = results[0] as Map?;
      final reports = (results[1] as List?) ?? [];
      final payments = (results[2] as List?) ?? [];
      final orders = (results[3] as List?) ?? [];

      return _Data(
        shops: shops,
        selectedShopId: activeShopId,
        subscription: sub,
        reports: reports,
        orders: orders,
        payments: payments,
      );
    } catch (e, stack) {
      debugPrint('Error fetching commission data: $e\n$stack');
      return _Data(shops: [], selectedShopId: null);
    }
  }

  void _onShopChanged(String? shopId) {
    if (shopId != null) {
      setState(() {
        _selectedShopId = shopId;
        _future = _fetchData(shopId);
      });
    }
  }

  final _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: kVendorBg,
      drawer: const VendorDrawer(currentRoute: '/vendor/commission'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: Text(l10n.vendorDrawerCommissions, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: context.canPop()
            ? IconButton(
                icon: HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: kVendorText, size: 20),
                onPressed: () => context.pop(),
              )
            : Builder(
                builder: (context) => IconButton(
                  icon: const HugeIcon(icon: HugeIcons.strokeRoundedMenu01, size: 20),
                  onPressed: () {
                    Scaffold.of(context).openDrawer();
                  },
                ),
              ),
      ),
      body: FutureBuilder<_Data>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)));
          }
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                    const SizedBox(height: 16),
                    Text('Failed to load commission data', style: TextStyle(color: kVendorText, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('${snap.error}', style: TextStyle(color: kVendorSubText, fontSize: 12), textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => setState(() { _future = _fetchData(null); }),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)));
          }

          final d = snap.data!;
          if (d.shops.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    HugeIcon(icon: HugeIcons.strokeRoundedStore01, size: 48, color: kVendorSubText),
                    const SizedBox(height: 16),
                    Text(
                      'No shops registered',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: kVendorText),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'You do not own any shops registered on this platform.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: kVendorSubText),
                    ),
                  ],
                ),
              ),
            );
          }

          // Date filtering on mobile client
          final filteredOrders = d.orders.where((o) {
            final dateStr = o['created_at'] as String?;
            if (dateStr == null) return false;
            final dt = DateTime.parse(dateStr);
            final matchMonth = _selectedMonth == null ? true : dt.month == _selectedMonth;
            final matchYear = _selectedYear == null ? true : dt.year == _selectedYear;
            return matchMonth && matchYear;
          }).toList();

          final filteredPayments = d.payments.where((p) {
            final dateStr = p['paid_at'] as String?;
            if (dateStr == null) return false;
            final dt = DateTime.parse(dateStr);
            final matchMonth = _selectedMonth == null ? true : dt.month == _selectedMonth;
            final matchYear = _selectedYear == null ? true : dt.year == _selectedYear;
            return matchMonth && matchYear;
          }).toList();

          final filteredReports = d.reports.where((r) {
            final matchMonth = _selectedMonth == null ? true : r['month'] == _selectedMonth;
            final matchYear = _selectedYear == null ? true : r['year'] == _selectedYear;
            return matchMonth && matchYear;
          }).toList();

          final double totalSales = filteredOrders.fold<double>(0.0, (sum, o) => sum + (o['total_final_price'] ?? 0).toDouble());
          final double totalPaid = filteredPayments.fold<double>(0.0, (sum, p) => sum + (p['amount'] ?? 0).toDouble());
          final double outstandingBalance = filteredReports.fold<double>(0.0, (sum, r) => sum + (r['balance_due'] ?? 0).toDouble());

          // Active free trial calculations
          int daysRemaining = 0;
          final sub = d.subscription;
          if (sub != null && sub['is_trial_active'] == true) {
            final end = DateTime.parse(sub['trial_end_date']);
            final now = DateTime.now();
            daysRemaining = end.difference(now).inDays;
            if (daysRemaining < 0) daysRemaining = 0;
          }

          return RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _future = _fetchData(_selectedShopId);
              });
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Dropdown Selector
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Finance Overview',
                            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: kVendorText, letterSpacing: -0.5),
                          ),
                          const SizedBox(height: 4),
                          Text('Manage trials, payouts & dues', style: TextStyle(fontSize: 12, color: kVendorSubText)),
                        ],
                      ),
                      if (d.shops.length > 1)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: kVendorCardBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: kVendorCardBorder),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: d.selectedShopId,
                              dropdownColor: kVendorBg,
                              icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                              items: d.shops.map((s) {
                                return DropdownMenuItem<String>(
                                  value: s.id,
                                  child: Text(
                                    s.name,
                                    style: TextStyle(color: kVendorText, fontSize: 13, fontWeight: FontWeight.bold),
                                  ),
                                );
                              }).toList(),
                              onChanged: _onShopChanged,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Date Filter selectors row
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: kVendorCardBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: kVendorCardBorder),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<int?>(
                              value: _selectedMonth,
                              dropdownColor: kVendorBg,
                              icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                              items: [
                                DropdownMenuItem<int?>(
                                  value: null,
                                  child: Text('All Months', style: TextStyle(color: kVendorText, fontSize: 13)),
                                ),
                                ...List.generate(12, (index) {
                                  return DropdownMenuItem<int?>(
                                    value: index + 1,
                                    child: Text(_monthNames[index], style: TextStyle(color: kVendorText, fontSize: 13)),
                                  );
                                }),
                              ],
                              onChanged: (val) {
                                setState(() {
                                  _selectedMonth = val;
                                });
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
                            color: kVendorCardBg,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: kVendorCardBorder),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<int?>(
                              value: _selectedYear,
                              dropdownColor: kVendorBg,
                              icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                              items: [
                                DropdownMenuItem<int?>(
                                  value: null,
                                  child: Text('All Years', style: TextStyle(color: kVendorText, fontSize: 13)),
                                ),
                                ...List.generate(6, (index) {
                                  final year = 2025 + index;
                                  return DropdownMenuItem<int?>(
                                    value: year,
                                    child: Text(year.toString(), style: TextStyle(color: kVendorText, fontSize: 13)),
                                  );
                                }),
                              ],
                              onChanged: (val) {
                                setState(() {
                                  _selectedYear = val;
                                });
                              },
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Free Trial Active Banner
                  if (sub != null && sub['is_trial_active'] == true) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0x2610B981), Color(0x26047857)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0x4D10B981)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0x3310B981),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const HugeIcon(icon: HugeIcons.strokeRoundedClock01, color: Color(0xFF10B981), size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Active Free Trial',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Your shop is under free trial. No commissions apply to delivered orders.',
                                  style: TextStyle(fontSize: 12, color: const Color(0xFF10B981).withValues(alpha: 0.85)),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Days remaining: $daysRemaining days · Ends: ${DateTime.parse(sub['trial_end_date']).toLocal().toString().split(' ')[0]}',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: kVendorSubText),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Overdue Warnings Banner (Level 1, 2, 3)
                  if (sub != null && sub['restriction_level'] >= 1) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0x26EF4444), Color(0x26B91C1C)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0x4DEF4444)),
                      ),
                      child: Row(
                        children: [
                          const HugeIcon(icon: HugeIcons.strokeRoundedAlertCircle, color: Color(0xFFEF4444), size: 24),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  sub['restriction_level'] == 1
                                      ? 'Dues Settlement Warning'
                                      : sub['restriction_level'] == 2
                                          ? 'Shop Visibility Reduced'
                                          : 'Order Processing Suspended',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFFFCA5A5)),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  sub['restriction_level'] == 1
                                      ? 'You have outstanding commission reports past the grace period. Please settle dues.'
                                      : sub['restriction_level'] == 2
                                          ? 'Your shop is demoted in customer directories due to overdue commission balances.'
                                          : 'Your shop is blocked from receiving new orders. Settle outstanding balances immediately.',
                                  style: const TextStyle(fontSize: 11, color: Color(0xFFFCA5A5)),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Financial Statistics Grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.15,
                    children: [
                      _buildStatCard(
                        icon: HugeIcons.strokeRoundedTrendingUpDown,
                        iconColor: const Color(0xFF60A5FA),
                        value: '₹${totalSales.toStringAsFixed(0)}',
                        label: 'Total Sales',
                      ),
                      _buildStatCard(
                        icon: HugeIcons.strokeRoundedPercent,
                        iconColor: const Color(0xFFFBBF24),
                        value: '${sub != null ? sub['commission_rate'] : '5'}%',
                        label: 'Commission Rate',
                      ),
                      _buildStatCard(
                        icon: HugeIcons.strokeRoundedMoney03,
                        iconColor: const Color(0xFF10B981),
                        value: '₹${totalPaid.toStringAsFixed(0)}',
                        label: 'Total Paid',
                      ),
                      _buildStatCard(
                        icon: HugeIcons.strokeRoundedAlertCircle,
                        iconColor: outstandingBalance > 0 ? Color(0xFFEF4444) : kVendorSubText,
                        value: '₹${outstandingBalance.toStringAsFixed(0)}',
                        label: 'Outstanding Due',
                        textColor: outstandingBalance > 0 ? const Color(0xFFEF4444) : Colors.white,
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Monthly Reports Title
                  Text(
                    'Billing Statements',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: kVendorText),
                  ),
                  const SizedBox(height: 12),

                  // Reports list
                  if (filteredReports.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
                      decoration: vendorCardDecoration(),
                      child: Column(
                        children: [
                          HugeIcon(icon: HugeIcons.strokeRoundedInvoice, size: 36, color: kVendorSubText.withValues(alpha: 0.5)),
                          const SizedBox(height: 12),
                          Text(
                            'No reports generated yet',
                            style: TextStyle(color: kVendorSubText, fontSize: 13, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Billing summaries will compile at the end of cycles.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: kVendorSubText.withValues(alpha: 0.7), fontSize: 11),
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: filteredReports.length,
                      itemBuilder: (context, index) {
                        final r = filteredReports[index];
                        final monthStr = _monthNames[r['month'] - 1];
                        final yearStr = '${r['year']}';
                        final commission = (r['total_commission'] ?? 0).toDouble();
                        final status = r['payment_status'] as String;

                        VendorBadgeType badgeType = VendorBadgeType.neutral;
                        if (status == 'paid') {
                          badgeType = VendorBadgeType.success;
                        } else if (status == 'partially_paid') {
                          badgeType = VendorBadgeType.warning;
                        } else if (status == 'pending') {
                          badgeType = VendorBadgeType.danger;
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: vendorCardDecoration(radius: 16),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            title: Text(
                              '$monthStr $yearStr',
                              style: TextStyle(fontWeight: FontWeight.bold, color: kVendorText, fontSize: 15),
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 4.0),
                              child: Text(
                                'Sales: ₹${r['total_sales']} · Commission: ₹$commission',
                                style: TextStyle(color: kVendorSubText, fontSize: 12),
                              ),
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                VendorBadge(label: status, type: badgeType),
                                const SizedBox(height: 6),
                                Text(
                                  'Due: ₹${r['balance_due']}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: (r['balance_due'] ?? 0) > 0 ? Color(0xFFEF4444) : kVendorSubText,
                                  ),
                                )
                              ],
                            ),
                            onTap: () => _showReportDetails(context, r),
                          ),
                        );
                      },
                    ),
                  const SizedBox(height: 24),
                  _buildTermsCard(),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTermsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: vendorCardDecoration(radius: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const HugeIcon(icon: HugeIcons.strokeRoundedShield01, color: Color(0xFF8B5CF6), size: 20),
              const SizedBox(width: 8),
              Text(
                'Commission Terms & Policies',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: kVendorText),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Official platform commission fees, billing schedules, and shop restriction guidelines.',
            style: TextStyle(fontSize: 12, color: kVendorSubText),
          ),
          const SizedBox(height: 16),
          _buildPolicyRow(
            title: 'Trial & Payouts',
            bullets: [
              '30-Day Free Trial: 0% commission is charged on orders generated during trial.',
              '5% Commission: Default rate applied automatically after trial period ends.',
              'Billing Cycle: Reports and balances are generated on the 1st of every month.',
            ],
            iconColor: const Color(0xFF10B981),
          ),
          const SizedBox(height: 12),
          _buildPolicyRow(
            title: 'Delivered Trigger',
            bullets: [
              'Sales Calculation: Commission is only charged for orders marked as "Delivered".',
              'Cancellations: Cancelled/reverted orders automatically retract commission due.',
            ],
            iconColor: const Color(0xFF60A5FA),
          ),
          const SizedBox(height: 12),
          _buildPolicyRow(
            title: 'Late Payment Restrictions',
            bullets: [
              'L1 Warning (15 Days Overdue): Notice banner appears on dashboard.',
              'L2 Demoted (20 Days Overdue): Shop visibility pushed to bottom of directories.',
              'L3 Suspended (30 Days Overdue): Blocked from receiving new customer orders.',
            ],
            iconColor: const Color(0xFFF87171),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyRow({
    required String title,
    required List<String> bullets,
    required Color iconColor,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: iconColor),
        ),
        const SizedBox(height: 4),
        ...bullets.map((b) => Padding(
          padding: const EdgeInsets.only(left: 8.0, bottom: 4.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('• ', style: TextStyle(color: kVendorSubText, fontSize: 12)),
              Expanded(
                child: Text(
                  b,
                  style: TextStyle(color: kVendorSubText, fontSize: 11, height: 1.4),
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }

  Widget _buildStatCard({
    required List<List<dynamic>> icon,
    required Color iconColor,
    required String value,
    required String label,
    Color textColor = Colors.white,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: vendorCardDecoration(radius: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: iconColor.withValues(alpha: 0.2)),
            ),
            child: HugeIcon(icon: icon, color: iconColor, size: 18),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: textColor, letterSpacing: -0.5),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(fontSize: 10, color: kVendorSubText, fontWeight: FontWeight.w600),
              ),
            ],
          )
        ],
      ),
    );
  }

  void _showReportDetails(BuildContext context, Map r) {
    final monthStr = _monthNames[r['month'] - 1];
    final yearStr = '${r['year']}';

    showModalBottomSheet(
      context: context,
      backgroundColor: kVendorBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$monthStr $yearStr Invoice',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: kVendorText),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white70),
                    onPressed: () => Navigator.pop(context),
                  )
                ],
              ),
              const Divider(color: Color(0x14FFFFFF), height: 24),
              _buildDetailRow('Total Sales Generated', '₹${r['total_sales']}'),
              _buildDetailRow('Commission Rate', '${r['commission_rate']}%'),
              _buildDetailRow('Total Commission Due', '₹${r['total_commission']}'),
              _buildDetailRow('Amount Settled', '₹${r['amount_paid']}', valColor: const Color(0xFF10B981)),
              _buildDetailRow('Outstanding Balance', '₹${r['balance_due']}', valColor: (r['balance_due'] ?? 0) > 0 ? const Color(0xFFEF4444) : Colors.white),
              const Divider(color: Color(0x14FFFFFF), height: 24),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'To download this invoice or make digital payments, please visit the marketplace admin portal on the web.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: kVendorSubText, fontStyle: FontStyle.italic),
                ),
              ),
              const SizedBox(height: 16),
              VendorGradientButton(
                onPressed: () => Navigator.pop(context),
                width: double.infinity,
                child: const Text('Close Details', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(String label, String val, {Color? valColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: kVendorSubText, fontWeight: FontWeight.w500)),
          Text(val, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: valColor ?? kVendorText)),
        ],
      ),
    );
  }
}

class _Shop {
  final String id, name;
  _Shop({required this.id, required this.name});
}

class _Data {
  final List<_Shop> shops;
  final String? selectedShopId;
  final Map? subscription;
  final List reports;
  final List orders;
  final List payments;

  _Data({
    required this.shops,
    required this.selectedShopId,
    this.subscription,
    this.reports = const [],
    this.orders = const [],
    this.payments = const [],
  });
}
