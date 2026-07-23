import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/auth_service.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  final _phoneCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl  = TextEditingController();

  bool _loading = false;
  bool _showPw = false;
  bool _showConfirm = false;
  String? _error;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _phoneCtrl.text = authService.currentUser?.phone ?? '';
  }

  Future<void> _changePhone() async {
    setState(() {
      _error = 'Updating phone number will be available in a future update.';
      _successMessage = null;
    });
  }

  Future<void> _changePassword() async {
    if (_loading) return;
    final l10n = AppLocalizations.of(context)!;
    final password = _passwordCtrl.text;
    final confirm = _confirmCtrl.text;

    if (password.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters.');
      return;
    }
    if (password != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }

    setState(() { _loading = true; _error = null; _successMessage = null; });
    try {
      await authService.updatePassword(password);
      setState(() {
        _successMessage = l10n.securityPasswordSuccess;
        _passwordCtrl.clear();
        _confirmCtrl.clear();
      });
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _logoutAll() async {
    final l10n = AppLocalizations.of(context)!;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.securitySignOutAll),
        content: Text(l10n.securityConfirmSignOutAll),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.securityCancel)),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text(l10n.securitySignOutAll),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() { _loading = true; _error = null; _successMessage = null; });
    try {
      await authService.signOutFromAllDevices();
      if (mounted) context.go('/login');
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: Text(l10n.securityTitle),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_successMessage != null) ...[
              _buildSuccessAlert(_successMessage!),
              const SizedBox(height: 20),
            ],
            if (_error != null) ...[
              _buildErrorAlert(_error!),
              const SizedBox(height: 20),
            ],

            // 1. Change Phone section
            _buildCardSection(
              title: l10n.securityChangePhone,
              icon: Icons.phone_android_outlined,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildInputField(
                    label: l10n.authPhone,
                    hintText: '+1 555-555-5555',
                    controller: _phoneCtrl,
                    keyboardType: TextInputType.phone,
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: _loading ? null : _changePhone,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kWaTeal,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(l10n.securityRequestPhoneChange),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. Change Password section
            _buildCardSection(
              title: l10n.securityChangePassword,
              icon: Icons.lock_outline,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildInputField(
                    label: l10n.securityNewPassword,
                    hintText: 'Min. 8 characters',
                    controller: _passwordCtrl,
                    obscureText: !_showPw,
                    suffixIcon: GestureDetector(
                      onTap: () => setState(() => _showPw = !_showPw),
                      child: Icon(
                        _showPw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        size: 20,
                        color: kNeutral500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _buildInputField(
                    label: l10n.securityConfirmNewPassword,
                    hintText: 'Repeat password',
                    controller: _confirmCtrl,
                    obscureText: !_showConfirm,
                    suffixIcon: GestureDetector(
                      onTap: () => setState(() => _showConfirm = !_showConfirm),
                      child: Icon(
                        _showConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        size: 20,
                        color: kNeutral500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: _loading ? null : _changePassword,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kWaTeal,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(l10n.securityUpdatePassword),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 3. Global Logout section
            _buildCardSection(
              title: l10n.securitySignOutAll,
              icon: Icons.devices_outlined,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    l10n.securityDangerZoneDesc,
                    style: const TextStyle(fontSize: 13, color: kNeutral500, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loading ? null : _logoutAll,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: Text(l10n.securitySignOutAll),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCardSection({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    final isDark = ThemeService.instance.isDarkMode;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(isDark ? 30 : 10),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: kWaTeal),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : kNeutral800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required String hintText,
    required TextEditingController controller,
    bool obscureText = false,
    Widget? suffixIcon,
    TextInputType? keyboardType,
  }) {
    final isDark = ThemeService.instance.isDarkMode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: kNeutral500,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF0F172A) : kNeutral100,
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: controller,
                  obscureText: obscureText,
                  keyboardType: keyboardType,
                  style: TextStyle(fontSize: 14, color: isDark ? Colors.white : kNeutral800, fontWeight: FontWeight.w500),
                  decoration: InputDecoration(
                    hintText: hintText,
                    hintStyle: const TextStyle(color: kNeutral400, fontSize: 13),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              if (suffixIcon != null) suffixIcon,
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessAlert(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFDCFCE7),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF86EFAC)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: Color(0xFF166534), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(0xFF166534),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorAlert(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEE2E2),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFCA5A5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, color: Color(0xFF991B1B), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(0xFF991B1B),
                fontSize: 13,
                fontWeight: FontWeight.w500,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
