import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/supabase_client.dart';
import 'vendor_drawer.dart';
import 'vendor_theme_helper.dart';

class VendorReplacementsScreen extends StatefulWidget {
  const VendorReplacementsScreen({super.key});

  @override
  State<VendorReplacementsScreen> createState() => _VendorReplacementsScreenState();
}

class _VendorReplacementsScreenState extends State<VendorReplacementsScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late Future<List<Map<String, dynamic>>> _future;
  String _statusFilter = 'all';
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<List<Map<String, dynamic>>> _fetch() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return [];

    // Get vendor's shop IDs
    final owners = await supabase
        .from('shop_owners')
        .select('shop_id')
        .eq('user_id', userId);

    final shopIds = (owners as List).map((e) => e['shop_id'] as String).toList();
    if (shopIds.isEmpty) return [];

    final res = await supabase
        .from('replacement_requests')
        .select('*, orders(*, users(name, phone)), replacement_items(*, order_items(*, items(name))))')
        .filter('shop_id', 'in', shopIds)
        .order('created_at', ascending: false);

    return List<Map<String, dynamic>>.from(res as List);
  }

  Future<void> _updateStatus(String requestId, String shopId, String status, String? notes) async {
    try {
      await supabase
          .from('replacement_requests')
          .update({
            'status': status,
            'notes': notes,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', requestId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Request updated to $status')),
        );
        setState(() {
          _future = _fetch();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating status: $e')),
        );
      }
    }
  }

  void _showActionDialog(Map<String, dynamic> req) {
    final notesController = TextEditingController();
    String selectedDecision = 'approve_next_shift'; // 'approve_next_shift', 'approve_now', 'reject'

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: kVendorDialogBg,
          title: Text('Resolve Replacement Request', style: TextStyle(color: kVendorText, fontWeight: FontWeight.bold, fontSize: 18)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Select Decision:', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 10),
                
                // Option 1: Approve & Deliver in Next Shift
                InkWell(
                  onTap: () => setDialogState(() => selectedDecision = 'approve_next_shift'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: selectedDecision == 'approve_next_shift' ? const Color(0xFF3B82F6).withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.03),
                      border: Border.all(
                        color: selectedDecision == 'approve_next_shift' ? const Color(0xFF3B82F6) : Colors.white.withValues(alpha: 0.08),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.schedule_rounded, color: selectedDecision == 'approve_next_shift' ? const Color(0xFF60A5FA) : Colors.grey, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Approve & Deliver in Next Shift', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w800, fontSize: 13)),
                              const SizedBox(height: 2),
                              Text('Batched for the next delivery shift', style: TextStyle(color: kVendorSubText, fontSize: 11)),
                            ],
                          ),
                        ),
                        if (selectedDecision == 'approve_next_shift')
                          const Icon(Icons.check_circle, color: Color(0xFF60A5FA), size: 18),
                      ],
                    ),
                  ),
                ),

                // Option 2: Approve & Deliver Now
                InkWell(
                  onTap: () => setDialogState(() => selectedDecision = 'approve_now'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: selectedDecision == 'approve_now' ? const Color(0xFF22C55E).withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.03),
                      border: Border.all(
                        color: selectedDecision == 'approve_now' ? const Color(0xFF22C55E) : Colors.white.withValues(alpha: 0.08),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.bolt_rounded, color: selectedDecision == 'approve_now' ? const Color(0xFF4ADE80) : Colors.grey, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Approve & Deliver Now', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w800, fontSize: 13)),
                              const SizedBox(height: 2),
                              Text('Immediate dispatch to customer', style: TextStyle(color: kVendorSubText, fontSize: 11)),
                            ],
                          ),
                        ),
                        if (selectedDecision == 'approve_now')
                          const Icon(Icons.check_circle, color: Color(0xFF4ADE80), size: 18),
                      ],
                    ),
                  ),
                ),

                // Option 3: Reject with Reason
                InkWell(
                  onTap: () => setDialogState(() => selectedDecision = 'reject'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: selectedDecision == 'reject' ? const Color(0xFFEF4444).withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.03),
                      border: Border.all(
                        color: selectedDecision == 'reject' ? const Color(0xFFEF4444) : Colors.white.withValues(alpha: 0.08),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.cancel_outlined, color: selectedDecision == 'reject' ? const Color(0xFFF87171) : Colors.grey, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Reject Request with Reason', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w800, fontSize: 13)),
                              const SizedBox(height: 2),
                              Text('Decline replacement with customer explanation', style: TextStyle(color: kVendorSubText, fontSize: 11)),
                            ],
                          ),
                        ),
                        if (selectedDecision == 'reject')
                          const Icon(Icons.check_circle, color: Color(0xFFF87171), size: 18),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 14),
                Text(
                  selectedDecision == 'reject' ? 'Rejection Reason (Required):' : 'Seller Delivery Notes (Optional):',
                  style: TextStyle(color: selectedDecision == 'reject' ? const Color(0xFFF87171) : kVendorText, fontWeight: FontWeight.w700, fontSize: 12),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: notesController,
                  maxLines: 3,
                  style: TextStyle(color: kVendorText, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: selectedDecision == 'reject' ? 'Explain why this claim is being declined...' : 'Add delivery note or instructions for customer...',
                    hintStyle: TextStyle(color: kVendorSubText, fontSize: 12),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.05),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  ),
                ),
                if (selectedDecision != 'reject') ...[
                  const SizedBox(height: 6),
                  Text(
                    'ℹ️ Once approved, the customer will confirm receipt upon delivery.',
                    style: TextStyle(color: kVendorSubText, fontSize: 11, fontStyle: FontStyle.italic),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text('Cancel', style: TextStyle(color: kVendorSubText)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: selectedDecision == 'reject' ? const Color(0xFFEF4444) : const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                final text = notesController.text.trim();
                if (selectedDecision == 'reject' && text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a rejection reason.')),
                  );
                  return;
                }

                Navigator.of(ctx).pop();
                String finalStatus = selectedDecision == 'reject' ? 'Rejected' : 'Approved';
                String finalNotes = text;
                if (selectedDecision == 'approve_next_shift') {
                  finalNotes = text.isNotEmpty ? '$text [Delivery: Next Shift]' : 'Approved for replacement. Delivery scheduled in the next shift.';
                } else if (selectedDecision == 'approve_now') {
                  finalNotes = text.isNotEmpty ? '$text [Delivery: Out Now]' : 'Approved for immediate replacement. Dispatched for delivery now.';
                }

                _updateStatus(req['id'] as String, req['shop_id'] as String, finalStatus, finalNotes);
              },
              child: Text(selectedDecision == 'reject' ? 'Reject Claim' : 'Confirm & Approve'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: kVendorBg,
      drawer: const VendorDrawer(currentRoute: '/vendor/replacements'),
      appBar: AppBar(
        backgroundColor: kVendorCardBg,
        elevation: 0,
        leading: IconButton(
          icon: HugeIcon(icon: HugeIcons.strokeRoundedMenu01, color: kVendorText),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text('Complaints & Replacements', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w800, fontSize: 18)),
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }

          final allRequests = snapshot.data!;
          final requests = allRequests.filter((req) {
            final st = (req['status'] as String? ?? '').toLowerCase();
            if (_statusFilter != 'all' && st != _statusFilter) return false;
            if (_searchQuery.isNotEmpty) {
              final q = _searchQuery.toLowerCase();
              final custName = (req['orders'] as Map?)?['users']?['name']?.toString().toLowerCase() ?? '';
              final orderNum = (req['orders'] as Map?)?['order_number']?.toString().toLowerCase() ?? '';
              if (!custName.contains(q) && !orderNum.contains(q)) return false;
            }
            return true;
          }).toList();

          return Column(
            children: [
              // Filter chips & Search
              Container(
                padding: const EdgeInsets.all(16),
                color: kVendorCardBg,
                child: Column(
                  children: [
                    TextField(
                      onChanged: (val) => setState(() => _searchQuery = val),
                      style: TextStyle(color: kVendorText, fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Search customer name or order #...',
                        hintStyle: TextStyle(color: kVendorSubText, fontSize: 13),
                        prefixIcon: Icon(Icons.search, color: kVendorSubText),
                        filled: true,
                        fillColor: kVendorInputBg,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: kVendorCardBorder)),
                        contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: ['all', 'pending', 'approved', 'rejected', 'completed'].map((st) {
                          final isSelected = _statusFilter == st;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(st.toUpperCase()),
                              selected: isSelected,
                              selectedColor: const Color(0xFF3B82F6),
                              labelStyle: TextStyle(color: isSelected ? Colors.white : kVendorText, fontWeight: FontWeight.bold, fontSize: 12),
                              onSelected: (val) {
                                if (val) setState(() => _statusFilter = st);
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: requests.isEmpty
                    ? Center(
                        child: Text('No complaint/replacement requests found.', style: TextStyle(color: kVendorSubText, fontSize: 15)),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: requests.length,
                        itemBuilder: (context, idx) {
                          final req = requests[idx];
                          final reqStatus = req['status'] as String? ?? 'Pending';
                          final reason = req['reason'] as String? ?? '';
                          final desc = req['description'] as String?;
                          final notes = req['notes'] as String?;
                          final order = req['orders'] as Map?;
                          final userObj = order?['users'] as Map?;
                          final custName = userObj?['name'] ?? 'Customer';
                          final custPhone = userObj?['phone'] ?? '';
                          final orderNum = order?['order_number'] ?? req['order_id'].toString().substring(0, 8);
                          final createdAt = DateTime.parse(req['created_at'] as String);
                          final items = (req['replacement_items'] as List?) ?? [];
                          final customerImages = (req['customer_images'] as List?)?.map((e) => e.toString()).toList() ??
                                                 (req['proof_images'] as List?)?.map((e) => e.toString()).toList() ?? [];

                          Color statusColor = const Color(0xFFF59E0B);
                          if (reqStatus == 'Approved' || reqStatus == 'Completed') statusColor = const Color(0xFF22C55E);
                          if (reqStatus == 'Rejected') statusColor = const Color(0xFFEF4444);

                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: kVendorCardBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: kVendorCardBorder),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('#$orderNum · $custName', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kVendorText)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: statusColor.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(reqStatus.toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: statusColor)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(DateFormat('d MMM yyyy, h:mm a').format(createdAt), style: TextStyle(fontSize: 12, color: kVendorSubText)),
                                if (custPhone.isNotEmpty) Text('Phone: $custPhone', style: TextStyle(fontSize: 12, color: kVendorSubText)),
                                const Divider(height: 20),

                                Text('Reason: $reason', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kVendorText)),
                                if (desc != null && desc.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text('Details: $desc', style: TextStyle(fontSize: 13, color: kVendorSubText)),
                                ],

                                if (customerImages.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Text('Evidence Photos:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText)),
                                  const SizedBox(height: 6),
                                  SingleChildScrollView(
                                    scrollDirection: Axis.horizontal,
                                    child: Row(
                                      children: customerImages.map((imgUrl) {
                                        return GestureDetector(
                                          onTap: () {
                                            showDialog(
                                              context: context,
                                              builder: (ctx) => Dialog(
                                                backgroundColor: Colors.transparent,
                                                insetPadding: const EdgeInsets.all(12),
                                                child: Stack(
                                                  alignment: Alignment.topRight,
                                                  children: [
                                                    ClipRRect(
                                                      borderRadius: BorderRadius.circular(16),
                                                      child: Image.network(imgUrl, fit: BoxFit.contain),
                                                    ),
                                                    IconButton(
                                                      icon: const Icon(Icons.close, color: Colors.white, size: 28),
                                                      onPressed: () => Navigator.pop(ctx),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            );
                                          },
                                          child: Container(
                                            margin: const EdgeInsets.only(right: 8),
                                            width: 64,
                                            height: 64,
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(color: kVendorCardBorder),
                                            ),
                                            child: ClipRRect(
                                              borderRadius: BorderRadius.circular(12),
                                              child: Image.network(imgUrl, fit: BoxFit.cover),
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    ),
                                  ),
                                ],

                                if (items.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Text('Requested Items:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: kVendorText)),
                                  ...items.map((ri) {
                                    final itemName = (ri['order_items'] as Map?)?['items']?['name'] ?? 'Item';
                                    final qty = ri['quantity'] ?? 1;
                                    return Text('• $itemName × $qty', style: TextStyle(fontSize: 13, color: kVendorSubText));
                                  }),
                                ],

                                if (notes != null && notes.isNotEmpty) ...[
                                  const SizedBox(height: 10),
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: kVendorInputBg,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text('Seller Notes: $notes', style: TextStyle(fontSize: 12, color: kVendorText, fontStyle: FontStyle.italic)),
                                  ),
                                ],

                                const SizedBox(height: 14),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton.icon(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF3B82F6),
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    onPressed: () => _showActionDialog(req),
                                    icon: const Icon(Icons.edit_note_rounded, color: Colors.white, size: 18),
                                    label: const Text('Manage & Resolve Request', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

extension ListFilter<E> on List<E> {
  List<E> filter(bool Function(E element) test) {
    return where(test).toList();
  }
}
