import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/theme_service.dart';
import 'admin_drawer.dart';

class AdminCommissionScreen extends StatefulWidget {
  const AdminCommissionScreen({super.key});

  @override
  State<AdminCommissionScreen> createState() => _AdminCommissionScreenState();
}

class _AdminCommissionScreenState extends State<AdminCommissionScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late Future<_AdminData> _future;
  bool _loading = false;

  // Search and filters
  final _searchCtrl = TextEditingController();
  final _trialSearchCtrl = TextEditingController();
  String _trialFilter = 'active'; // active, expired, all

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _future = _fetchAdminData();
    _searchCtrl.addListener(() => setState(() {}));
    _trialSearchCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchCtrl.dispose();
    _trialSearchCtrl.dispose();
    super.dispose();
  }

  Future<_AdminData> _fetchAdminData() async {
    // 1. Fetch overview stats
    final shopsRes = await supabase.from('shops').select('id');
    final totalShops = (shopsRes as List).length;

    final trialsRes = await supabase.from('shop_subscription').select('id').eq('is_trial_active', true);
    final shopsInTrial = (trialsRes as List).length;

    final activePayersRes = await supabase.from('shop_subscription').select('id').eq('is_trial_active', false).eq('commission_enabled', true);
    final shopsPayingCommission = (activePayersRes as List).length;

    final overdueRes = await supabase.from('shop_subscription').select('id').gt('restriction_level', 0);
    final shopsWithOutstanding = (overdueRes as List).length;

    // 2. Fetch revenue stats
    final ordersRes = await supabase.from('orders').select('total_final_price').eq('status', 'delivered');
    final totalSales = (ordersRes as List).fold<double>(0.0, (sum, o) => sum + (o['total_final_price'] ?? 0).toDouble());

    final txsRes = await supabase.from('commission_transactions').select('commission_amount');
    final totalCommissionGenerated = (txsRes as List).fold<double>(0.0, (sum, t) => sum + (t['commission_amount'] ?? 0).toDouble());

    final paymentsRes = await supabase.from('commission_payments').select('amount');
    final totalCommissionCollected = (paymentsRes as List).fold<double>(0.0, (sum, p) => sum + (p['amount'] ?? 0).toDouble());

    final outstandingCommission = (totalCommissionGenerated - totalCommissionCollected).clamp(0.0, double.infinity);

    // 3. Fetch pending payments list
    final pendingRes = await supabase
        .from('monthly_commission_reports')
        .select('*, shops(name)')
        .neq('payment_status', 'paid')
        .order('generated_at', ascending: true);

    final pendingPayments = (pendingRes as List).map((r) {
      final genDate = DateTime.parse(r['generated_at']);
      final daysOverdue = DateTime.now().difference(genDate).inDays;
      return _PendingPayment(
        id: r['id'] as String,
        shopId: r['shop_id'] as String,
        shopName: (r['shops'] as Map?)?['name'] as String? ?? 'Unknown Shop',
        month: r['month'] as int,
        year: r['year'] as int,
        commissionDue: (r['balance_due'] ?? 0).toDouble(),
        daysOverdue: daysOverdue,
        status: r['payment_status'] as String,
      );
    }).toList();

    // 4. Fetch trial shops list
    final trialShopsRes = await supabase
        .from('shops')
        .select('id, name, created_at, shop_subscription(trial_start_date, trial_end_date, is_trial_active, commission_rate, commission_enabled)')
        .order('name');

    final trialShops = (trialShopsRes as List).where((s) => s['shop_subscription'] != null).map((s) {
      final sub = s['shop_subscription'] as Map;
      return _TrialShop(
        id: s['id'] as String,
        name: s['name'] as String,
        trialStartDate: DateTime.parse(sub['trial_start_date']),
        trialEndDate: DateTime.parse(sub['trial_end_date']),
        isTrialActive: sub['is_trial_active'] as bool,
        commissionRate: (sub['commission_rate'] ?? 0.0).toDouble(),
      );
    }).toList();

    return _AdminData(
      totalShops: totalShops,
      shopsInTrial: shopsInTrial,
      shopsPayingCommission: shopsPayingCommission,
      shopsWithOutstanding: shopsWithOutstanding,
      totalSales: totalSales,
      totalCommissionGenerated: totalCommissionGenerated,
      totalCommissionCollected: totalCommissionCollected,
      outstandingCommission: outstandingCommission,
      pendingPayments: pendingPayments,
      trialShops: trialShops,
    );
  }

  Future<void> _syncRestrictions() async {
    setState(() => _loading = true);
    try {
      final settingsRes = await supabase.from('commission_settings').select('*').eq('id', 1).maybeSingle();
      final settings = settingsRes as Map?;
      final warningDays = settings?['grace_period_warning'] ?? 15;
      final restrictionDays = settings?['grace_period_restriction'] ?? 20;
      final blockDays = settings?['grace_period_block'] ?? 30;

      final subsRes = await supabase.from('shop_subscription').select('*');
      final subs = (subsRes as List).cast<Map<String, dynamic>>();

      for (final sub in subs) {
        final shopId = sub['shop_id'] as String;
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

        if (sub['restriction_level'] != targetLevel) {
          await supabase
              .from('shop_subscription')
              .update({'restriction_level': targetLevel})
              .eq('shop_id', shopId);
        }
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Restriction levels synchronized successfully!')),
        );
        _refresh();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sync failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _refresh() {
    setState(() {
      _future = _fetchAdminData();
    });
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
      drawer: const AdminDrawer(currentRoute: '/admin/commission'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kText,
        title: const Text('Commissions', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: kText, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
        actions: [
          IconButton(
            icon: const HugeIcon(icon: HugeIcons.strokeRoundedStore01, size: 20),
            onPressed: () => context.push('/admin/commission/shops'),
            tooltip: 'Shop Billing Data',
          ),
          IconButton(
            icon: _loading 
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF8B5CF6)))
                : const HugeIcon(icon: HugeIcons.strokeRoundedRefresh01, size: 20),
            onPressed: _loading ? null : _syncRestrictions,
            tooltip: 'Sync Restrictions',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: FutureBuilder<_AdminData>(
        future: _future,
        builder: (context, snap) {
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)));
          }

          final d = snap.data!;

          // Filter collections
          final query = _searchCtrl.text.toLowerCase();
          final filteredCollections = d.pendingPayments.where((p) {
            return p.shopName.toLowerCase().contains(query);
          }).toList();

          // Filter trial shops
          final trialQuery = _trialSearchCtrl.text.toLowerCase();
          final filteredTrials = d.trialShops.where((s) {
            final matchesQuery = s.name.toLowerCase().contains(trialQuery);
            if (_trialFilter == 'active') {
              return matchesQuery && s.isTrialActive;
            } else if (_trialFilter == 'expired') {
              return matchesQuery && !s.isTrialActive;
            }
            return matchesQuery;
          }).toList();

          return RefreshIndicator(
            onRefresh: () async => _refresh(),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Admin Console', style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: kText, letterSpacing: -1)),
                  const SizedBox(height: 6),
                  Text('Manage platform commissions, collect payments & trials', style: TextStyle(fontSize: 16, color: kSubText)),
                  const SizedBox(height: 24),

                  // Overview Cards Grid
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.25,
                    children: [
                      _buildSummaryCard(
                        isDark: isDark,
                        icon: HugeIcons.strokeRoundedTrendingUpDown,
                        iconColor: const Color(0xFF3B82F6),
                        value: '₹${d.totalSales.toStringAsFixed(0)}',
                        label: 'Total Sales',
                        kText: kText,
                        kSubText: kSubText,
                      ),
                      _buildSummaryCard(
                        isDark: isDark,
                        icon: HugeIcons.strokeRoundedMoney03,
                        iconColor: const Color(0xFF8B5CF6),
                        value: '₹${d.totalCommissionGenerated.toStringAsFixed(0)}',
                        label: 'Generated',
                        kText: kText,
                        kSubText: kSubText,
                      ),
                      _buildSummaryCard(
                        isDark: isDark,
                        icon: HugeIcons.strokeRoundedCheckmarkCircle02,
                        iconColor: const Color(0xFF10B981),
                        value: '₹${d.totalCommissionCollected.toStringAsFixed(0)}',
                        label: 'Collected',
                        kText: kText,
                        kSubText: kSubText,
                      ),
                      _buildSummaryCard(
                        isDark: isDark,
                        icon: HugeIcons.strokeRoundedAlertCircle,
                        iconColor: d.outstandingCommission > 0 ? const Color(0xFFEF4444) : kSubText,
                        value: '₹${d.outstandingCommission.toStringAsFixed(0)}',
                        label: 'Outstanding',
                        textColor: d.outstandingCommission > 0 ? const Color(0xFFEF4444) : kText,
                        kText: kText,
                        kSubText: kSubText,
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Tabs
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF18181B) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: kDivider),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: TabBar(
                      controller: _tabController,
                      indicatorSize: TabBarIndicatorSize.tab,
                      indicator: BoxDecoration(
                        color: isDark ? const Color(0xFF27272A) : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          if (!isDark)
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                        ],
                      ),
                      labelColor: kText,
                      unselectedLabelColor: kSubText,
                      labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      tabs: const [
                        Tab(text: 'Pending Collections'),
                        Tab(text: 'Trial Management'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Tab Views in single scrollable via Conditional Rendering
                  AnimatedBuilder(
                    animation: _tabController,
                    builder: (context, _) {
                      if (_tabController.index == 0) {
                        return _buildCollectionsTab(isDark, kText, kSubText, kDivider, filteredCollections);
                      } else {
                        return _buildTrialsTab(isDark, kText, kSubText, kDivider, filteredTrials);
                      }
                    },
                  ),
                  const SizedBox(height: 24),
                  _buildTermsCard(isDark, kText, kSubText),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCollectionsTab(bool isDark, Color kText, Color kSubText, Color kDivider, List<_PendingPayment> payments) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Search Input
        TextField(
          controller: _searchCtrl,
          style: TextStyle(color: kText, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Search shop...',
            hintStyle: TextStyle(color: kSubText.withValues(alpha: 0.6)),
            prefixIcon: HugeIcon(icon: HugeIcons.strokeRoundedSearch01, color: kSubText, size: 18),
            filled: true,
            fillColor: isDark ? const Color(0xFF18181B) : Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 12),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: kDivider)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: const Color(0xFF8B5CF6))),
          ),
        ),
        const SizedBox(height: 16),

        if (payments.isEmpty)
          _buildEmptyState('No pending payments', 'Outstanding commissions will be listed here.', isDark, kSubText)
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: payments.length,
            itemBuilder: (context, i) {
              final p = payments[i];
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: _cardDecoration(isDark),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              p.shopName,
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: kText),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: p.daysOverdue > 30 ? const Color(0x26EF4444) : const Color(0x26FBBF24),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${p.daysOverdue} days overdue',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: p.daysOverdue > 30 ? const Color(0xFFEF4444) : const Color(0xFFD97706),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Period: ${p.month}/${p.year}  ·  Due: ₹${p.commissionDue.toStringAsFixed(2)}',
                        style: TextStyle(color: kSubText, fontSize: 13),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _collectPaymentDialog(p),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFF10B981)),
                                foregroundColor: const Color(0xFF10B981),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: const Text('Collect', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _waiveDialog(p),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFFEF4444)),
                                foregroundColor: const Color(0xFFEF4444),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: const Text('Waive', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      )
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildTrialsTab(bool isDark, Color kText, Color kSubText, Color kDivider, List<_TrialShop> trials) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Search & Filter
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _trialSearchCtrl,
                style: TextStyle(color: kText, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Search trial...',
                  hintStyle: TextStyle(color: kSubText.withValues(alpha: 0.6)),
                  prefixIcon: HugeIcon(icon: HugeIcons.strokeRoundedSearch01, color: kSubText, size: 18),
                  filled: true,
                  fillColor: isDark ? const Color(0xFF18181B) : Colors.white,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: kDivider)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: const Color(0xFF8B5CF6))),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: kDivider),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _trialFilter,
                  dropdownColor: isDark ? const Color(0xFF18181B) : Colors.white,
                  items: const [
                    DropdownMenuItem(value: 'active', child: Text('Active', style: TextStyle(fontSize: 12))),
                    DropdownMenuItem(value: 'expired', child: Text('Expired', style: TextStyle(fontSize: 12))),
                    DropdownMenuItem(value: 'all', child: Text('All', style: TextStyle(fontSize: 12))),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _trialFilter = val);
                  },
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        if (trials.isEmpty)
          _buildEmptyState('No trial shops', 'Trials list matches search criteria.', isDark, kSubText)
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: trials.length,
            itemBuilder: (context, i) {
              final t = trials[i];
              final now = DateTime.now();
              int remaining = t.trialEndDate.difference(now).inDays;
              if (remaining < 0) remaining = 0;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                decoration: _cardDecoration(isDark),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              t.name,
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: kText),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: t.isTrialActive ? const Color(0x2610B981) : const Color(0x2664748B),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              t.isTrialActive ? '$remaining days left' : 'Expired',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: t.isTrialActive ? const Color(0xFF10B981) : kSubText,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Ends: ${t.trialEndDate.toLocal().toString().split(' ')[0]}  ·  Commission: ${t.commissionRate.toStringAsFixed(1)}%',
                        style: TextStyle(color: kSubText, fontSize: 13),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _extendTrialDialog(t),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Color(0xFF3B82F6)),
                                foregroundColor: const Color(0xFF3B82F6),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              child: const Text('Extend Trial', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                          if (t.isTrialActive) ...[
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => _endTrial(t),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: Color(0xFFEF4444)),
                                  foregroundColor: const Color(0xFFEF4444),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                child: const Text('End Trial', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                            ),
                          ]
                        ],
                      )
                    ],
                  ),
                ),
              );
            },
          ),
      ],
    );
  }

  Widget _buildEmptyState(String title, String desc, bool isDark, Color kSubText) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
      decoration: _cardDecoration(isDark),
      child: Column(
        children: [
          HugeIcon(icon: HugeIcons.strokeRoundedAlertCircle, size: 36, color: kSubText.withValues(alpha: 0.5)),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(color: kSubText, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(desc, textAlign: TextAlign.center, style: TextStyle(color: kSubText.withValues(alpha: 0.7), fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildSummaryCard({
    required bool isDark,
    required List<List<dynamic>> icon,
    required Color iconColor,
    required String value,
    required String label,
    required Color kText,
    required Color kSubText,
    Color? textColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(isDark),
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
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: textColor ?? kText, letterSpacing: -0.5),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(fontSize: 10, color: kSubText, fontWeight: FontWeight.w600),
              ),
            ],
          )
        ],
      ),
    );
  }

  BoxDecoration _cardDecoration(bool isDark) {
    return BoxDecoration(
      color: isDark ? const Color(0xFF18181B) : Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(
        color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
      ),
    );
  }

  // Collect Payment Dialog
  void _collectPaymentDialog(_PendingPayment p) {
    final amountCtrl = TextEditingController(text: p.commissionDue.toString());
    String method = 'cash';
    final refCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: ThemeService.instance.isDarkMode ? const Color(0xFF09090B) : Colors.white,
              title: Text('Collect Payment - ${p.shopName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: amountCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Amount (₹) *'),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      value: method,
                      decoration: const InputDecoration(labelText: 'Method *'),
                      items: const [
                        DropdownMenuItem(value: 'cash', child: Text('💵 Cash')),
                        DropdownMenuItem(value: 'upi', child: Text('📱 UPI')),
                        DropdownMenuItem(value: 'bank_transfer', child: Text('🏦 Bank Transfer')),
                      ],
                      onChanged: (val) {
                        if (val != null) setDialogState(() => method = val);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: refCtrl,
                      decoration: const InputDecoration(labelText: 'Ref (Optional)'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesCtrl,
                      decoration: const InputDecoration(labelText: 'Notes (Optional)'),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    final amount = double.tryParse(amountCtrl.text);
                    if (amount == null || amount <= 0 || amount > p.commissionDue) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter a valid amount up to outstanding dues.')),
                      );
                      return;
                    }
                    Navigator.pop(context);
                    await _recordPayment(p, amount, method, refCtrl.text.trim(), notesCtrl.text.trim());
                  },
                  child: const Text('Record'),
                )
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _recordPayment(_PendingPayment p, double amount, String method, String ref, String notes) async {
    setState(() => _loading = true);
    try {
      final reportRes = await supabase.from('monthly_commission_reports').select('*').eq('id', p.id).single();
      final report = reportRes as Map;
      
      final newPaid = (report['amount_paid'] ?? 0).toDouble() + amount;
      final newDue = ((report['total_commission'] ?? 0).toDouble() - newPaid).clamp(0.0, double.infinity);
      final newStatus = newDue == 0.0 ? 'paid' : 'partially_paid';

      // Insert payment
      await supabase.from('commission_payments').insert({
        'shop_id': p.shopId,
        'report_id': p.id,
        'amount': amount,
        'payment_method': method,
        'transaction_reference': ref.isEmpty ? null : ref,
        'notes': notes.isEmpty ? null : notes,
      });

      // Update report status
      await supabase.from('monthly_commission_reports').update({
        'amount_paid': newPaid,
        'balance_due': newDue,
        'payment_status': newStatus,
      }).eq('id', p.id);

      // Update transactions if fully settled
      if (newStatus == 'paid') {
        final startDate = DateTime(p.year, p.month, 1).toUtc().toIso8601String();
        final endDate = DateTime(p.year, p.month + 1, 1).toUtc().toIso8601String();
        
        await supabase
            .from('commission_transactions')
            .update({'commission_status': 'paid'})
            .eq('shop_id', p.shopId)
            .eq('commission_status', 'pending')
            .gte('generated_at', startDate)
            .lt('generated_at', endDate);
      }

      // Audit log
      await supabase.from('commission_audit_logs').insert({
        'action': 'Payment Recorded',
        'shop_id': p.shopId,
        'previous_value': 'Paid: ₹${report['amount_paid']}, Due: ₹${report['balance_due']}',
        'new_value': 'Paid: ₹$newPaid, Due: ₹$newDue',
        'notes': 'Recorded ₹$amount payment via $method. Ref: ${ref.isEmpty ? 'N/A' : ref}'
      });

      // Trigger recalculation of restriction level
      await _syncRestrictions();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment record failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Waive Dialog
  void _waiveDialog(_PendingPayment p) {
    final reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: ThemeService.instance.isDarkMode ? const Color(0xFF09090B) : Colors.white,
          title: Text('Waive Commission - ${p.shopName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          content: TextField(
            controller: reasonCtrl,
            decoration: const InputDecoration(labelText: 'Reason for Waiver *'),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final reason = reasonCtrl.text.trim();
                if (reason.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Waiver reason is required.')));
                  return;
                }
                Navigator.pop(context);
                await _applyWaiver(p, reason);
              },
              child: const Text('Waive Dues', style: TextStyle(color: Colors.red)),
            )
          ],
        );
      },
    );
  }

  Future<void> _applyWaiver(_PendingPayment p, String reason) async {
    setState(() => _loading = true);
    try {
      final reportRes = await supabase.from('monthly_commission_reports').select('*').eq('id', p.id).single();
      final report = reportRes as Map;
      
      final amount = (report['balance_due'] ?? 0).toDouble();

      // Update report status to paid
      await supabase.from('monthly_commission_reports').update({
        'amount_paid': (report['amount_paid'] ?? 0).toDouble() + amount,
        'balance_due': 0.0,
        'payment_status': 'paid',
      }).eq('id', p.id);

      // Waive transactions
      final startDate = DateTime(p.year, p.month, 1).toUtc().toIso8601String();
      final endDate = DateTime(p.year, p.month + 1, 1).toUtc().toIso8601String();
      
      await supabase
          .from('commission_transactions')
          .update({
            'commission_status': 'waived',
            'commission_amount': 0.0,
            'waive_reason': reason,
          })
          .eq('shop_id', p.shopId)
          .eq('commission_status', 'pending')
          .gte('generated_at', startDate)
          .lt('generated_at', endDate);

      // Audit Log
      await supabase.from('commission_audit_logs').insert({
        'action': 'Commission Waived',
        'shop_id': p.shopId,
        'previous_value': 'Due: ₹$amount',
        'new_value': 'Due: ₹0.0',
        'notes': 'Waived report period ${p.month}/${p.year}. Reason: $reason'
      });

      await _syncRestrictions();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Waiver failed: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Extend Trial Dialog
  void _extendTrialDialog(_TrialShop t) {
    String extendDays = '7';
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: ThemeService.instance.isDarkMode ? const Color(0xFF09090B) : Colors.white,
              title: Text('Extend Trial - ${t.name}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              content: DropdownButtonFormField<String>(
                value: extendDays,
                decoration: const InputDecoration(labelText: 'Extension Days'),
                items: const [
                  DropdownMenuItem(value: '7', child: Text('7 Days')),
                  DropdownMenuItem(value: '15', child: Text('15 Days')),
                  DropdownMenuItem(value: '30', child: Text('30 Days')),
                  DropdownMenuItem(value: '60', child: Text('60 Days')),
                ],
                onChanged: (val) {
                  if (val != null) setDialogState(() => extendDays = val);
                },
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(context);
                    await _extendTrial(t, int.parse(extendDays));
                  },
                  child: const Text('Extend'),
                )
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _extendTrial(_TrialShop t, int days) async {
    setState(() => _loading = true);
    try {
      final subRes = await supabase.from('shop_subscription').select('*').eq('shop_id', t.id).single();
      final sub = subRes as Map;
      
      final currentEnd = DateTime.parse(sub['trial_end_date']);
      final base = currentEnd.isAfter(DateTime.now()) ? currentEnd : DateTime.now();
      final newEnd = base.add(Duration(days: days));

      await supabase.from('shop_subscription').update({
        'trial_end_date': newEnd.toUtc().toIso8601String(),
        'is_trial_active': true,
      }).eq('shop_id', t.id);

      // Audit Log
      await supabase.from('commission_audit_logs').insert({
        'action': 'Trial Extended',
        'shop_id': t.id,
        'previous_value': 'Ends: ${currentEnd.toString().split(' ')[0]}',
        'new_value': 'Ends: ${newEnd.toString().split(' ')[0]}',
        'notes': 'Extended trial by $days days.'
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Trial extended by $days days successfully.')));
        _refresh();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to extend trial: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // End Trial
  Future<void> _endTrial(_TrialShop t) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: ThemeService.instance.isDarkMode ? const Color(0xFF09090B) : Colors.white,
          title: const Text('End Free Trial', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Text('Are you sure you want to end the free trial for ${t.name}? This will immediately activate order commission charges.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text('End Trial', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );

    if (confirm != true) return;

    setState(() => _loading = true);
    try {
      await supabase.from('shop_subscription').update({
        'is_trial_active': false,
        'trial_end_date': DateTime.now().toUtc().toIso8601String(),
      }).eq('shop_id', t.id);

      // Audit Log
      await supabase.from('commission_audit_logs').insert({
        'action': 'Trial Ended',
        'shop_id': t.id,
        'previous_value': 'Trial Active: true',
        'new_value': 'Trial Active: false',
        'notes': 'Manually ended free trial.'
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Free trial ended and commission enabled.')));
        _refresh();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to end trial: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _buildTermsCard(bool isDark, Color kText, Color kSubText) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const HugeIcon(icon: HugeIcons.strokeRoundedShield01, color: Color(0xFF8B5CF6), size: 20),
              const SizedBox(width: 8),
              Text(
                'Commission Terms & Policies',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: kText),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Official platform commission fees, billing schedules, and shop restriction guidelines.',
            style: TextStyle(fontSize: 12, color: kSubText),
          ),
          const SizedBox(height: 16),
          _buildPolicyRow(
            title: 'Trial & Payouts',
            bullets: [
              '30-Day Free Trial: 0% commission is charged on orders generated during trial.',
              'Category Commission (2.5% / 4%): Applied automatically per line item after trial period ends.',
              'Billing Cycle: Reports and balances are generated on the 1st of every month.',
            ],
            kSubText: kSubText,
            iconColor: const Color(0xFF10B981),
          ),
          const SizedBox(height: 12),
          _buildPolicyRow(
            title: 'Delivered Trigger',
            bullets: [
              'Sales Calculation: Commission is only charged for orders marked as "Delivered".',
              'Cancellations: Cancelled/reverted orders automatically retract commission due.',
            ],
            kSubText: kSubText,
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
            kSubText: kSubText,
            iconColor: const Color(0xFFF87171),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyRow({
    required String title,
    required List<String> bullets,
    required Color kSubText,
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
              Text('• ', style: TextStyle(color: kSubText, fontSize: 12)),
              Expanded(
                child: Text(
                  b,
                  style: TextStyle(color: kSubText, fontSize: 11, height: 1.4),
                ),
              ),
            ],
          ),
        )),
      ],
    );
  }
}

class _PendingPayment {
  final String id, shopId, shopName, status;
  final int month, year, daysOverdue;
  final double commissionDue;
  _PendingPayment({
    required this.id,
    required this.shopId,
    required this.shopName,
    required this.month,
    required this.year,
    required this.commissionDue,
    required this.daysOverdue,
    required this.status,
  });
}

class _TrialShop {
  final String id, name;
  final DateTime trialStartDate, trialEndDate;
  final bool isTrialActive;
  final double commissionRate;
  _TrialShop({
    required this.id,
    required this.name,
    required this.trialStartDate,
    required this.trialEndDate,
    required this.isTrialActive,
    required this.commissionRate,
  });
}

class _AdminData {
  final int totalShops, shopsInTrial, shopsPayingCommission, shopsWithOutstanding;
  final double totalSales, totalCommissionGenerated, totalCommissionCollected, outstandingCommission;
  final List<_PendingPayment> pendingPayments;
  final List<_TrialShop> trialShops;

  _AdminData({
    required this.totalShops,
    required this.shopsInTrial,
    required this.shopsPayingCommission,
    required this.shopsWithOutstanding,
    required this.totalSales,
    required this.totalCommissionGenerated,
    required this.totalCommissionCollected,
    required this.outstandingCommission,
    required this.pendingPayments,
    required this.trialShops,
  });
}
