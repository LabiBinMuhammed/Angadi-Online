import 'package:flutter/material.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';
import 'admin_drawer.dart';

class AdminFeedbacksScreen extends StatefulWidget {
  const AdminFeedbacksScreen({super.key});

  @override
  State<AdminFeedbacksScreen> createState() => _AdminFeedbacksScreenState();
}

class _AdminFeedbacksScreenState extends State<AdminFeedbacksScreen> {
  List<Map<String, dynamic>> _feedbacks = [];
  bool _loading = true;
  String _statusFilter = 'all';

  final Map<String, String> _typeLabels = {
    'suggestion': 'Suggestion',
    'complaint': 'Complaint',
    'bug_report': 'Bug Report',
    'feature_request': 'Feature Request',
    'general': 'General',
  };

  @override
  void initState() {
    super.initState();
    _loadFeedbacks();
  }

  Future<void> _loadFeedbacks() async {
    setState(() => _loading = true);
    try {
      // Query feedbacks and join with users to get submitter name and phone
      final response = await supabase
          .from('feedbacks')
          .select('*, users(name, phone)')
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _feedbacks = List<Map<String, dynamic>>.from(response as List);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load feedbacks: $e')),
        );
      }
    }
  }

  Future<void> _updateStatus(String id, String newStatus) async {
    try {
      await supabase
          .from('feedbacks')
          .update({'status': newStatus})
          .eq('id', id);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Feedback status updated to ${newStatus.toUpperCase()}'),
            backgroundColor: kSuccess,
            behavior: SnackBarBehavior.floating,
          ),
        );
        // Local update to avoid full reload
        setState(() {
          final idx = _feedbacks.indexWhere((f) => f['id'] == id);
          if (idx >= 0) {
            _feedbacks[idx]['status'] = newStatus;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update status: $e'),
            backgroundColor: kDanger,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'new':
        return const Color(0xFF3B82F6);
      case 'in_review':
        return const Color(0xFFF59E0B);
      case 'resolved':
        return const Color(0xFF10B981);
      case 'closed':
        return const Color(0xFF64748B);
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final kCardBg = isDark ? kNeutral800 : Colors.white;
    final kBorder = isDark ? kNeutral700 : kNeutral200;

    final filtered = _feedbacks.where((f) {
      if (_statusFilter == 'all') return true;
      return f['status'] == _statusFilter;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
      drawer: const AdminDrawer(currentRoute: '/admin/feedbacks'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Platform Feedbacks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadFeedbacks,
          ),
        ],
      ),
      body: Column(
        children: [
          // Status filters row
          SizedBox(
            height: 60,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              children: ['all', 'new', 'in_review', 'resolved', 'closed'].map((status) {
                final isSelected = _statusFilter == status;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(status == 'all' ? 'All' : status.toUpperCase().replaceAll('_', ' ')),
                    selected: isSelected,
                    selectedColor: kWaGreenDark,
                    checkmarkColor: Colors.white,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : (isDark ? Colors.white70 : kNeutral800),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    onSelected: (_) {
                      setState(() => _statusFilter = status);
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          // Feedback list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? Center(
                        child: Text(
                          'No feedbacks found',
                          style: TextStyle(
                            fontSize: 16,
                            color: isDark ? kNeutral400 : kNeutral600,
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, idx) {
                          final f = filtered[idx];
                          final user = f['users'] as Map<String, dynamic>?;
                          final userName = user?['name'] ?? 'Guest';
                          final userPhone = user?['phone'] ?? 'No Phone';
                          final type = f['type'] as String? ?? 'general';
                          final rating = f['rating'] as int?;
                          final message = f['message'] as String? ?? '';
                          final status = f['status'] as String? ?? 'new';
                          final created = DateTime.parse(f['created_at'] as String);
                          final dateStr = '${created.day}/${created.month}/${created.year}';

                          return Container(
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
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          userName,
                                          style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 14,
                                            color: isDark ? Colors.white : kNeutral900,
                                          ),
                                        ),
                                        Text(
                                          userPhone,
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: kNeutral500,
                                          ),
                                        ),
                                      ],
                                    ),
                                    Text(
                                      dateStr,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        color: kNeutral500,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Divider(),
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: isDark ? kNeutral700 : kNeutral100,
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            _typeLabels[type] ?? type.toUpperCase(),
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w700,
                                              color: isDark ? Colors.white : kNeutral800,
                                            ),
                                          ),
                                        ),
                                        if (rating != null) ...[
                                          const SizedBox(width: 8),
                                          Row(
                                            children: List.generate(rating, (_) {
                                              return const Icon(
                                                Icons.star_rounded,
                                                color: Color(0xFFF59E0B),
                                                size: 14,
                                              );
                                            }),
                                          ),
                                        ],
                                      ],
                                    ),

                                    // Status Selector Popup Menu
                                    PopupMenuButton<String>(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: _getStatusColor(status).withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(
                                              status.toUpperCase().replaceAll('_', ' '),
                                              style: TextStyle(
                                                color: _getStatusColor(status),
                                                fontSize: 11,
                                                fontWeight: FontWeight.w800,
                                              ),
                                            ),
                                            const SizedBox(width: 4),
                                            Icon(
                                              Icons.arrow_drop_down,
                                              color: _getStatusColor(status),
                                              size: 16,
                                            ),
                                          ],
                                        ),
                                      ),
                                      onSelected: (newStatus) => _updateStatus(f['id'], newStatus),
                                      itemBuilder: (context) {
                                        return ['new', 'in_review', 'resolved', 'closed'].map((s) {
                                          return PopupMenuItem<String>(
                                            value: s,
                                            child: Text(
                                              s.toUpperCase().replaceAll('_', ' '),
                                              style: TextStyle(
                                                color: _getStatusColor(s),
                                                fontWeight: FontWeight.bold,
                                                fontSize: 13,
                                              ),
                                            ),
                                          );
                                        }).toList();
                                      },
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  message,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark ? Colors.white : kNeutral900,
                                    height: 1.4,
                                  ),
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
