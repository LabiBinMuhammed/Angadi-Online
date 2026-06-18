import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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
    if (_loading) return;
    final newPhone = _phoneCtrl.text.trim();
    if (newPhone.isEmpty) {
      setState(() => _error = 'Please enter a new phone number.');
      return;
    }
    if (newPhone == authService.currentUser?.phone) {
      setState(() => _error = 'Please enter a different phone number.');
      return;
    }
    if (newPhone.length < 8) {
      setState(() => _error = 'Please enter a valid phone number (including country code).');
      return;
    }

    setState(() { _loading = true; _error = null; _successMessage = null; });
    try {
      // Supabase: updating phone sends OTP to new phone number
      await authService.updatePhone(newPhone);
      
      if (mounted) {
        final verified = await context.push<bool>('/otp-verification', extra: {
          'phone': authService.currentUser?.phone ?? '',
          'flow': 'changePhone',
          'newPhone': newPhone,
        });

        if (verified == true) {
          setState(() {
            _successMessage = 'Phone number updated successfully!';
            _phoneCtrl.text = authService.currentUser?.phone ?? newPhone;
          });
        }
      }
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _changePassword() async {
    if (_loading) return;
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
        _successMessage = 'Password updated successfully!';
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
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out Everywhere'),
        content: const Text('Are you sure you want to sign out from all devices? You will need to log back in.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Sign Out everywhere'),
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
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Security Settings'),
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
              title: 'Change Phone Number',
              icon: Icons.phone_android_outlined,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildInputField(
                    label: 'New phone number',
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
                    child: const Text('Update Phone Number'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 2. Change Password section
            _buildCardSection(
              title: 'Change Password',
              icon: Icons.lock_outline,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildInputField(
                    label: 'New password',
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
                    label: 'Confirm new password',
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
                    child: const Text('Update Password'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 3. Global Logout section
            _buildCardSection(
              title: 'Global Device Logout',
              icon: Icons.devices_outlined,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Sign out from all active sessions and devices, including other mobile phones, web browsers, and tablets.',
                    style: TextStyle(fontSize: 13, color: kNeutral500, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loading ? null : _logoutAll,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Sign Out From All Devices'),
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
