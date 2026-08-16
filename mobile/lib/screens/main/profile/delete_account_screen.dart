import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/auth_service.dart';
import '../../../theme/app_theme.dart';

class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  final _reasonCtrl = TextEditingController();
  bool _agreed = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitDeletionRequest() async {
    if (!_agreed) {
      setState(() => _error = 'Please check the box to confirm you understand your data will be deleted.');
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Permanent Account Deletion'),
        content: const Text(
          'Are you sure you want to permanently delete your account? All your addresses, credentials, and profile info will be permanently purged.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Yes, Delete My Account', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        // Record deletion request in feedbacks table
        await Supabase.instance.client.from('feedbacks').insert({
          'user_id': user.id,
          'comment': '[ACCOUNT DELETION REQUEST] Reason: ${_reasonCtrl.text.trim().isEmpty ? "User requested via app deletion screen" : _reasonCtrl.text.trim()}',
          'category': 'other',
        });

        // Sign out user
        await authService.signOut();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Account deletion request submitted. You have been signed out.'),
              backgroundColor: Color(0xFF10B981),
            ),
          );
          context.go('/intro');
        }
      }
    } catch (e) {
      setState(() => _error = 'Failed to submit deletion request: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _launchEmail() async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: 'support@angadionline.com',
      query: 'subject=Angadi%20Account%20Deletion%20Assistance',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? kNeutral900 : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Delete Account',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : kNeutral900,
          ),
        ),
        centerTitle: true,
        backgroundColor: isDark ? kNeutral900 : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: isDark ? Colors.white : kNeutral900, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Warning Banner
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark 
                      ? [const Color(0xFF450A0A), const Color(0xFF0F172A)]
                      : [const Color(0xFFFEF2F2), const Color(0xFFFFF1F2)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? const Color(0xFFEF4444).withOpacity(0.3) : const Color(0xFFEF4444).withOpacity(0.2),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: const HugeIcon(
                      icon: HugeIcons.strokeRoundedDelete02,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Delete Account & Data',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : kNeutral900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Google Play User Data Compliance',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // What happens section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? kNeutral800 : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? kNeutral700 : const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'What will be permanently deleted:',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : kNeutral900,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildBullet('Your profile, name, and phone number credentials.', isDark),
                  _buildBullet('All saved home, work, and custom delivery addresses.', isDark),
                  _buildBullet('Your favorites, pinned shops, and device notification tokens.', isDark),
                  const SizedBox(height: 8),
                  Text(
                    'Note: Completed transaction receipts are retained only for shop accounting/tax compliance.',
                    style: TextStyle(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Reason Input
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? kNeutral800 : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? kNeutral700 : const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Reason for leaving (Optional)',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : kNeutral900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _reasonCtrl,
                    maxLines: 3,
                    style: TextStyle(fontSize: 14, color: isDark ? Colors.white : kNeutral900),
                    decoration: InputDecoration(
                      hintText: 'Tell us how we could have done better...',
                      hintStyle: TextStyle(color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8), fontSize: 13),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Agreement Checkbox
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: _agreed,
                        activeColor: const Color(0xFFEF4444),
                        onChanged: (val) => setState(() => _agreed = val ?? false),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _agreed = !_agreed),
                          child: Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Text(
                              'I understand that this action is irreversible and my personal data will be purged within 30 days.',
                              style: TextStyle(
                                fontSize: 13,
                                color: isDark ? const Color(0xFFCBD5E1) : kNeutral700,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: Color(0xFFDC2626), fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _loading ? null : _submitDeletionRequest,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFEF4444),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                icon: _loading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const HugeIcon(icon: HugeIcons.strokeRoundedDelete02, color: Colors.white, size: 20),
                label: Text(
                  _loading ? 'Submitting...' : 'Request Account Deletion',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Email Support Option
            Center(
              child: InkWell(
                onTap: _launchEmail,
                child: const Padding(
                  padding: EdgeInsets.all(8.0),
                  child: Text(
                    'Need assistance? Contact support@angadionline.com',
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFF64748B),
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildBullet(String text, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFFEF4444))),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13.5,
                color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
