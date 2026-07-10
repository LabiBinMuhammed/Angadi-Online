import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';
import 'vendor_drawer.dart';


class VendorCreditScreen extends StatefulWidget {
  const VendorCreditScreen({super.key});
  @override
  State<VendorCreditScreen> createState() => _VendorCreditScreenState();
}

class _VendorCreditScreenState extends State<VendorCreditScreen> {
  List<Map<String, dynamic>> _credits = [];
  bool _loading = true;
  String? _shopId;
  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
    _searchCtrl.addListener(() {
      setState(() {
        _searchQuery = _searchCtrl.text;
      });
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);

    try {
      final uid = supabase.auth.currentUser!.id;
      final ownerRes = await supabase.from('shop_owners').select('shop_id').eq('user_id', uid).maybeSingle();
      _shopId = ownerRes?['shop_id'] as String?;
      if (_shopId == null) {
        if (mounted) setState(() => _loading = false);
        return;
      }

      final res = await supabase
          .from('shop_user_credit')
          .select('*, users(name, phone)')
          .eq('shop_id', _shopId!)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _credits = (res as List).cast<Map<String, dynamic>>();
          _loading = false;
        });
      }
    } catch (e, stack) {
      debugPrint('Error loading vendor credits: $e\n$stack');
      if (mounted) {
        setState(() {
          _loading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading credits: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _toggle(Map<String, dynamic> c, String field) async {
    final next = !(c[field] as bool? ?? false);
    try {
      await supabase.from('shop_user_credit').update({field: next}).eq('id', c['id']);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(field == 'is_credit_enabled'
                ? 'Credit account ${next ? 'enabled' : 'disabled'}'
                : 'Customer account ${next ? 'blocked' : 'unblocked'}'),
            backgroundColor: kVendorDialogBg,
          ),
        );
      }
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _credits.where((c) {
      final name = ((c['users'] as Map?)?['name'] as String? ?? '').toLowerCase();
      final phone = (c['users'] as Map?)?['phone'] as String? ?? '';
      return name.contains(_searchQuery.toLowerCase()) || phone.contains(_searchQuery);
    }).toList();

    return Scaffold(
      backgroundColor: kVendorBg,
      drawer: const VendorDrawer(currentRoute: '/vendor/credit'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: const Text('Credit Management', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: Navigator.canPop(context)
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

      body: Column(
        children: [
          // Toolbar Search bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchCtrl,
              style: TextStyle(color: kVendorText, fontSize: 15),
              decoration: vendorInputDecoration(
                hintText: 'Search customer by name or phone...',
                prefixIcon: HugeIcon(icon: HugeIcons.strokeRoundedSearch01, color: kVendorSubText),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: HugeIcon(icon: HugeIcons.strokeRoundedCancel01, color: kVendorSubText),
                        onPressed: () => _searchCtrl.clear(),
                      )
                    : null,
              ),
            ),
          ),

          // Customer list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)))
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            HugeIcon(icon: HugeIcons.strokeRoundedCreditCard, size: 64, color: kVendorSubText.withValues(alpha: 0.5)),
                            const SizedBox(height: 16),
                            Text(
                              'No credit records found',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kVendorSubText),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: filtered.length,
                        itemBuilder: (context, i) {
                          final c = filtered[i];
                          final isEnabled = c['is_credit_enabled'] as bool? ?? false;
                          final isBlocked = c['is_blocked'] as bool? ?? false;
                          final limit = c['credit_limit'];
                          final used = c['used_amount'] ?? 0;
                          final name = (c['users'] as Map?)?['name'] ?? 'Guest Customer';
                          final phone = (c['users'] as Map?)?['phone'] ?? '';

                          Color statusColor = const Color(0xFF94A3B8);
                          if (isBlocked) {
                            statusColor = const Color(0xFFF87171);
                          } else if (isEnabled) {
                            statusColor = const Color(0xFF4ADE80);
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(14),
                            decoration: vendorCardDecoration(radius: 20),
                            child: Row(
                              children: [
                                // Icon
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                                  ),
                                  child: HugeIcon(icon: isBlocked
                                        ? HugeIcons.strokeRoundedUnavailable
                                        : isEnabled
                                            ? HugeIcons.strokeRoundedCreditCard
                                            : HugeIcons.strokeRoundedCreditCard, color: statusColor,
                                    size: 20,),
                                ),
                                const SizedBox(width: 14),

                                // Details
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        name,
                                        style: TextStyle(fontWeight: FontWeight.w700, color: kVendorText, fontSize: 15),
                                      ),
                                      if (phone.isNotEmpty) ...[
                                        const SizedBox(height: 2),
                                        Text(phone, style: TextStyle(color: kVendorSubText, fontSize: 12)),
                                      ],
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          VendorBadge(
                                            label: isEnabled ? 'Enabled' : 'Disabled',
                                            type: isEnabled ? VendorBadgeType.success : VendorBadgeType.neutral,
                                          ),
                                          const SizedBox(width: 6),
                                          VendorBadge(
                                            label: isBlocked ? 'Blocked' : 'Active',
                                            type: isBlocked ? VendorBadgeType.danger : VendorBadgeType.success,
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                // Limit setup & used display
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text('Used / Limit', style: TextStyle(color: kVendorSubText, fontSize: 10)),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Text(
                                          '₹$used',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 14,
                                            color: limit != null && used >= (limit as num) * 0.8
                                                ? const Color(0xFFF87171)
                                                : Colors.white,
                                          ),
                                        ),
                                        Text(' / ', style: TextStyle(color: kVendorSubText, fontSize: 12)),
                                        Text(
                                          limit != null ? '₹$limit' : '₹—',
                                          style: TextStyle(color: kVendorSubText, fontSize: 13),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    
                                    // Action buttons row
                                    Row(
                                      children: [
                                        // Enable/Disable toggle
                                        _MiniActionButton(
                                          icon: HugeIcons.strokeRoundedShutDown,
                                          color: isEnabled ? Color(0xFF4ADE80) : kVendorSubText,
                                          onPressed: () => _toggle(c, 'is_credit_enabled'),
                                          tooltip: isEnabled ? 'Disable Credit' : 'Enable Credit',
                                        ),
                                        const SizedBox(width: 4),
                                        // Block/Unblock toggle
                                        _MiniActionButton(
                                          icon: isBlocked ? HugeIcons.strokeRoundedShield01 : HugeIcons.strokeRoundedUnavailable,
                                          color: isBlocked ? Color(0xFFF87171) : kVendorSubText,
                                          onPressed: () => _toggle(c, 'is_blocked'),
                                          tooltip: isBlocked ? 'Unblock Customer' : 'Block Customer',
                                        ),
                                        const SizedBox(width: 4),
                                        // History
                                        _MiniActionButton(
                                          icon: HugeIcons.strokeRoundedWorkHistory,
                                          color: const Color(0xFF60A5FA),
                                          onPressed: () => context.push('/vendor/credit/${c['user_id']}'),
                                          tooltip: 'View History',
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
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

class _MiniActionButton extends StatelessWidget {
  final List<List<dynamic>> icon;
  final Color color;
  final VoidCallback onPressed;
  final String tooltip;

  const _MiniActionButton({
    required this.icon,
    required this.color,
    required this.onPressed,
    required this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(6),
        child: Container(
          width: 30,
          height: 30,
          decoration: BoxDecoration(
            color: kVendorTransparentBg,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
          ),
          child: Center(
            child: HugeIcon(icon: icon, color: color, size: 14),
          ),
        ),
      ),
    );
  }
}
