import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import 'admin_drawer.dart';

/// Admin Categories Screen
class AdminCategoriesScreen extends StatefulWidget {
  const AdminCategoriesScreen({super.key});
  @override
  State<AdminCategoriesScreen> createState() => _AdminCategoriesScreenState();
}

class _AdminCategoriesScreenState extends State<AdminCategoriesScreen> {
  List<Map<String, dynamic>> _categories = [];
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _orderCtrl = TextEditingController();
  bool _newIsActive = true;
  bool _loading = true;
  bool _saving  = false;

  @override
  void initState() { super.initState(); _load(); }

  InputDecoration _inputDeco(String label) {
    return InputDecoration(
      labelText: label,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      enabledBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: Color(0xFF333333), width: 1.5),
      ),
      focusedBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: kWaTeal, width: 2.0),
      ),
      border: const OutlineInputBorder(),
    );
  }

  Future<void> _load() async {
    try {
      final res = await supabase.from('categories').select('*').order('display_order', ascending: true);
      if (mounted) {
        setState(() {
          _categories = (res as List).cast<Map<String, dynamic>>();
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading categories: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _add() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      final int? orderVal = int.tryParse(_orderCtrl.text.trim());
      final res = await supabase.from('categories').insert({
        'name': _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
        'display_order': orderVal,
        'is_active': _newIsActive,
      }).select('*').single();
      
      if (mounted) {
        setState(() {
          _categories.add(res);
          _categories.sort((a, b) => ((a['display_order'] as num?)?.toInt() ?? 999)
              .compareTo(((b['display_order'] as num?)?.toInt() ?? 999)));
          _saving = false;
        });
        _nameCtrl.clear();
        _descCtrl.clear();
        _orderCtrl.clear();
        _newIsActive = true;
      }
    } catch (e) {
      debugPrint('Error adding category: $e');
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _toggle(Map<String, dynamic> cat) async {
    final next = !(cat['is_active'] as bool? ?? true);
    await supabase.from('categories').update({'is_active': next}).eq('id', cat['id']);
    setState(() {
      final idx = _categories.indexWhere((c) => c['id'] == cat['id']);
      if (idx >= 0) _categories[idx] = {..._categories[idx], 'is_active': next};
    });
  }

  void _showEditDialog(Map<String, dynamic> cat) {
    final nameEdit = TextEditingController(text: cat['name']);
    final descEdit = TextEditingController(text: cat['description'] ?? '');
    final orderEdit = TextEditingController(text: cat['display_order']?.toString() ?? '');
    bool statusEdit = cat['is_active'] as bool? ?? true;
    bool savingEdit = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Edit Category'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: nameEdit,
                      decoration: _inputDeco('Name *'),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: descEdit,
                      decoration: _inputDeco('Description (optional)'),
                    ),
                    const SizedBox(height: 10),
                    TextField(
                      controller: orderEdit,
                      keyboardType: TextInputType.number,
                      decoration: _inputDeco('Display Order (optional)'),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Active Status'),
                        Switch(
                          value: statusEdit,
                          activeThumbColor: kWaGreen,
                          onChanged: (val) {
                            setDialogState(() => statusEdit = val);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: kWaTeal, foregroundColor: Colors.white),
                  onPressed: savingEdit ? null : () async {
                    if (nameEdit.text.trim().isEmpty) return;
                    setDialogState(() => savingEdit = true);
                    try {
                      final int? orderVal = int.tryParse(orderEdit.text.trim());
                      await supabase.from('categories').update({
                        'name': nameEdit.text.trim(),
                        'description': descEdit.text.trim().isEmpty ? null : descEdit.text.trim(),
                        'display_order': orderVal,
                        'is_active': statusEdit,
                      }).eq('id', cat['id']);
                      
                      if (mounted) {
                        setState(() {
                          final idx = _categories.indexWhere((c) => c['id'] == cat['id']);
                          if (idx >= 0) {
                            _categories[idx] = {
                              ..._categories[idx],
                              'name': nameEdit.text.trim(),
                              'description': descEdit.text.trim().isEmpty ? null : descEdit.text.trim(),
                              'display_order': orderVal,
                              'is_active': statusEdit,
                            };
                            _categories.sort((a, b) => ((a['display_order'] as num?)?.toInt() ?? 999)
                                .compareTo(((b['display_order'] as num?)?.toInt() ?? 999)));
                          }
                        });
                        Navigator.pop(context);
                      }
                    } catch (e) {
                      debugPrint('Error updating category: $e');
                      setDialogState(() => savingEdit = false);
                    }
                  },
                  child: savingEdit ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showDeleteDialog(Map<String, dynamic> cat) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Category'),
          content: Text('Are you sure you want to delete "${cat['name']}"? Items using this category will lose their category association.'),
          actions: [
             TextButton(
               onPressed: () => Navigator.pop(context),
               child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
             ),
             ElevatedButton(
               style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
               onPressed: () async {
                 try {
                   await supabase.from('categories').delete().eq('id', cat['id']);
                   if (mounted) {
                     setState(() {
                       _categories.removeWhere((c) => c['id'] == cat['id']);
                     });
                     Navigator.pop(context);
                   }
                 } catch (e) {
                   debugPrint('Error deleting category: $e');
                 }
               },
               child: const Text('Delete'),
             ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/categories'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Categories'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: Column(
        children: [
          // Add form
          Card(
            margin: const EdgeInsets.all(12),
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Add New Category',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _nameCtrl,
                          decoration: _inputDeco('Category Name *'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 110,
                        child: TextField(
                          controller: _orderCtrl,
                          keyboardType: TextInputType.number,
                          decoration: _inputDeco('Display Order'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _descCtrl,
                    decoration: _inputDeco('Description (optional)'),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Text('Active Status: ', style: TextStyle(fontSize: 13)),
                          Switch(
                            value: _newIsActive,
                            activeThumbColor: kWaGreen,
                            onChanged: (val) {
                              setState(() => _newIsActive = val);
                            },
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kWaTeal,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                        onPressed: _saving ? null : _add,
                        icon: _saving
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.add, size: 16),
                        label: Text(_saving ? 'Adding...' : 'Add Category'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : Expanded(
                  child: ListView.separated(
                    itemCount: _categories.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final cat = _categories[i];
                      final isActive = cat['is_active'] as bool? ?? true;
                      return ListTile(
                        title: Text(
                          cat['name'] ?? '—',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        subtitle: cat['description'] != null ? Text(cat['description']) : null,
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit, color: Colors.blue, size: 20),
                              onPressed: () => _showEditDialog(cat),
                              tooltip: 'Rename/Edit',
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                              onPressed: () => _showDeleteDialog(cat),
                              tooltip: 'Delete',
                            ),
                            Switch(
                              value: isActive,
                              activeThumbColor: kWaGreen,
                              onChanged: (_) => _toggle(cat),
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

/// Admin Logs Screen (placeholder)
class AdminLogsScreen extends StatelessWidget {
  const AdminLogsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/logs'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Activity Logs'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: const Center(child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('🗒️', style: TextStyle(fontSize: 48)),
          SizedBox(height: 12),
          Text('No logs yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          SizedBox(height: 8),
          Text('System logs will appear here', style: TextStyle(color: Color(0xFF64748B))),
        ],
      )),
    );
  }
}

/// Admin Settings Screen
class AdminSettingsScreen extends StatelessWidget {
  const AdminSettingsScreen({super.key});

  static const _items = [
    ('💰', 'Default credit limit', '₹500'),
    ('📦', 'Max order items',      '50'),
    ('🌐', 'Default language',     'English'),
    ('🔔', 'Notifications',        'Enabled'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/settings'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Global Settings'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: ListView.separated(
        itemCount: _items.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, i) {
          final item = _items[i];
          return ListTile(
            leading: Text(item.$1, style: const TextStyle(fontSize: 24)),
            title: Text(item.$2, style: const TextStyle(fontWeight: FontWeight.w600)),
            trailing: Chip(
              label: Text(item.$3, style: const TextStyle(fontSize: 12, color: Color(0xFF075E54))),
              backgroundColor: const Color(0xFFE0F2FE),
            ),
          );
        },
      ),
    );
  }
}

/// Admin Credit Screen
class AdminCreditScreen extends StatefulWidget {
  const AdminCreditScreen({super.key});
  @override
  State<AdminCreditScreen> createState() => _AdminCreditScreenState();
}

class _AdminCreditScreenState extends State<AdminCreditScreen> {
  List<Map<String, dynamic>> _credits = [];
  bool _loading = true;
  double _totalUsed = 0;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await supabase.from('shop_user_credit').select('*, users(name, phone), shops(name)').order('used_amount', ascending: false).limit(100);
      if (mounted) {
        final list = (res as List).cast<Map<String, dynamic>>();
        setState(() {
          _credits = list;
          _totalUsed = list.fold(0.0, (sum, c) => sum + ((c['used_amount'] as num?)?.toDouble() ?? 0));
          _loading = false;
        });
      }
    } catch (e, stack) {
      debugPrint('Error loading admin credit: $e\n$stack');
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/credit'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Credit Monitor'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
      ),
      body: Column(
        children: [
          // Summary banner
          Container(
            padding: const EdgeInsets.all(16),
            color: kBrand100,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Text('Total Credit Used: ', style: TextStyle(color: kBrand700)),
              Text('₹${_totalUsed.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w800, color: kBrand700, fontSize: 18)),
            ]),
          ),
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : Expanded(
                  child: ListView.separated(
                    itemCount: _credits.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final c = _credits[i];
                      final isBlocked = c['is_blocked'] as bool? ?? false;
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isBlocked ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                          child: Icon(isBlocked ? Icons.block : Icons.credit_card,
                              color: isBlocked ? kDanger : kWaGreen, size: 20),
                        ),
                        title: Text((c['users'] as Map?)?['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${(c['shops'] as Map?)?['name'] ?? '—'} · ₹${c['used_amount'] ?? 0} used'),
                        trailing: Chip(
                          label: Text(isBlocked ? 'Blocked' : c['is_credit_enabled'] == true ? 'Active' : 'Off',
                              style: const TextStyle(fontSize: 11)),
                          backgroundColor: isBlocked
                              ? const Color(0xFFFEE2E2)
                              : c['is_credit_enabled'] == true ? const Color(0xFFDCFCE7) : kNeutral100,
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
