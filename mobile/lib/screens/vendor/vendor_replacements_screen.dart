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
    final notesController = TextEditingController(text: req['notes'] as String? ?? '');
    String selectedStatus = (req['status'] as String? ?? 'Pending') == 'Pending' ? 'Approved' : (req['status'] as String? ?? 'Approved');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: kVendorDialogBg,
        title: Text('Resolve Complaint Request', style: TextStyle(color: kVendorText, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Select Resolution Status:', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 8),
              StatefulBuilder(
                builder: (context, setDialogState) => Column(
                  children: [
                    RadioListTile<String>(
                      title: const Text('Approve Request', style: TextStyle(color: Color(0xFF22C55E), fontWeight: FontWeight.bold)),
                      value: 'Approved',
                      groupValue: selectedStatus,
                      onChanged: (val) => setDialogState(() => selectedStatus = val!),
                    ),
                    RadioListTile<String>(
                      title: const Text('Reject Request', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold)),
                      value: 'Rejected',
                      groupValue: selectedStatus,
                      onChanged: (val) => setDialogState(() => selectedStatus = val!),
                    ),
                    RadioListTile<String>(
                      title: const Text('Mark Completed (Delivered)', style: TextStyle(color: Color(0xFF3B82F6), fontWeight: FontWeight.bold)),
                      value: 'Completed',
                      groupValue: selectedStatus,
                      onChanged: (val) => setDialogState(() => selectedStatus = val!),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text('Seller Notes / Resolution details:', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 8),
              TextField(
                controller: notesController,
                maxLines: 3,
                style: TextStyle(color: kVendorText, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Enter resolution details or notes for customer...',
                  hintStyle: TextStyle(color: kVendorSubText, fontSize: 13),
                  filled: true,
                  fillColor: kVendorInputBg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: kVendorCardBorder)),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text('Cancel', style: TextStyle(color: kVendorSubText)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6)),
            onPressed: () {
              Navigator.of(ctx).pop();
              _updateStatus(req['id'] as String, req['shop_id'] as String, selectedStatus, notesController.text.trim());
            },
            child: const Text('Save Changes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
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
