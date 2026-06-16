import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _formKey = GlobalKey<FormState>();

  String _feedbackType = 'suggestion';
  int _rating = 5;
  final _messageController = TextEditingController();
  bool _submitting = false;

  List<FeedbackModel> _history = [];
  bool _loadingHistory = true;

  Map<String, String> _getTypeLabels(AppLocalizations l10n) {
    return {
      'suggestion': l10n.suggestionOption,
      'complaint': l10n.complaintOption,
      'bug_report': l10n.bugReportOption,
      'feature_request': l10n.featureRequestOption,
      'general': l10n.generalOption,
    };
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1) {
        _loadHistory();
      }
    });
    _loadHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    setState(() => _loadingHistory = true);
    try {
      final response = await supabase
          .from('feedbacks')
          .select('*, users(name)')
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _history = (response as List).map((json) => FeedbackModel.fromJson(json)).toList();
          _loadingHistory = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingHistory = false);
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.failedToLoadHistory(e.toString()))),
        );
      }
    }
  }

  Future<void> _submitFeedback() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      final userId = supabase.auth.currentUser?.id;
      
      await supabase.from('feedbacks').insert({
        'user_id': userId,
        'type': _feedbackType,
        'rating': _rating,
        'message': _messageController.text.trim(),
        'status': 'new',
      });

      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.feedbackSubmittedSuccess),
            backgroundColor: kSuccess,
            behavior: SnackBarBehavior.floating,
          ),
        );
        _messageController.clear();
        setState(() {
          _rating = 5;
          _feedbackType = 'suggestion';
          _submitting = false;
        });
        _loadHistory();
        _tabController.animateTo(1); // switch to history tab
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.failedToSubmitFeedback(e.toString())),
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
        return const Color(0xFF3B82F6); // Blue
      case 'in_review':
        return const Color(0xFFF59E0B); // Amber
      case 'resolved':
        return const Color(0xFF10B981); // Green
      case 'closed':
        return const Color(0xFF64748B); // Slate
      default:
        return const Color(0xFF64748B);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;
    final kCardBg = isDark ? kNeutral800 : Colors.white;
    final kBorder = isDark ? kNeutral700 : kNeutral200;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: Text(l10n.platformFeedbackTitle),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white.withValues(alpha: 0.6),
          indicatorColor: kWaGreen,
          tabs: [
            Tab(text: l10n.submitFeedbackTab),
            Tab(text: l10n.feedbackHistoryTab),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ── Tab 1: Submit Form ──────────────────────────────────────────
          SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.valueFeedbackHeader,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : kNeutral900,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.feedbackInstruction,
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? kNeutral400 : kNeutral600,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Feedback Type Card
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    decoration: BoxDecoration(
                      color: kCardBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: kBorder),
                    ),
                    child: DropdownButtonFormField<String>(
                      value: _feedbackType,
                      decoration: InputDecoration(
                        labelText: l10n.feedbackTypeLabel,
                        border: InputBorder.none,
                      ),
                      dropdownColor: kCardBg,
                      style: TextStyle(
                        color: isDark ? Colors.white : kNeutral900,
                        fontWeight: FontWeight.w600,
                      ),
                      items: _getTypeLabels(l10n).entries.map((e) {
                        return DropdownMenuItem(
                          value: e.key,
                          child: Text(e.value),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _feedbackType = val);
                      },
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Rating star selector
                  Text(
                    l10n.rateExperienceHeader,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: isDark ? kNeutral300 : kNeutral700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: List.generate(5, (index) {
                      final starVal = index + 1;
                      return IconButton(
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        icon: Icon(
                          starVal <= _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: const Color(0xFFF59E0B),
                          size: 44,
                        ),
                        onPressed: () {
                          setState(() => _rating = starVal);
                        },
                      );
                    }),
                  ),
                  const SizedBox(height: 24),

                  // Message text field
                  Text(
                    l10n.yourMessageLabel,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: isDark ? kNeutral300 : kNeutral700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: kCardBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: kBorder),
                    ),
                    padding: const EdgeInsets.all(4),
                    child: TextFormField(
                      controller: _messageController,
                      maxLines: 6,
                      decoration: InputDecoration(
                        hintText: l10n.feedbackPlaceholder,
                        border: InputBorder.none,
                      ),
                      style: TextStyle(color: isDark ? Colors.white : kNeutral900),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return l10n.enterMessageError;
                        }
                        if (value.trim().length < 10) {
                          return l10n.messageLengthError;
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submitFeedback,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kWaGreenDark,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                      child: _submitting
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(
                              l10n.submitFeedbackTab,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Tab 2: Feedback History ──────────────────────────────────────
          _loadingHistory
              ? const Center(child: CircularProgressIndicator())
              : _history.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const HugeIcon(
                            icon: HugeIcons.strokeRoundedChat01,
                            color: kNeutral400,
                            size: 64,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            l10n.noFeedbackHistory,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : kNeutral900,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(24),
                      itemCount: _history.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final fb = _history[index];
                        final formattedDate =
                            '${fb.createdAt.day}/${fb.createdAt.month}/${fb.createdAt.year}';
                        final statusColor = _getStatusColor(fb.status);

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
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: statusColor.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      fb.status.toUpperCase().replaceAll('_', ' '),
                                      style: TextStyle(
                                        color: statusColor,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    formattedDate,
                                    style: const TextStyle(
                                      color: kNeutral500,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isDark ? kNeutral700 : kNeutral100,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _getTypeLabels(l10n)[fb.type] ?? fb.type,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? Colors.white : kNeutral800,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'by ${fb.userName ?? "Guest"}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: kNeutral500,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  if (fb.rating != null) ...[
                                    const SizedBox(width: 8),
                                    Row(
                                      children: List.generate(fb.rating!, (_) {
                                        return const Icon(
                                          Icons.star_rounded,
                                          color: Color(0xFFF59E0B),
                                          size: 16,
                                        );
                                      }),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                fb.message,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: isDark ? Colors.white : kNeutral900,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        ],
      ),
    );
  }
}
