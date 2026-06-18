import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/auth_service.dart';
import '../../core/supabase_client.dart';
import '../../theme/app_theme.dart';
import '../../theme/theme_service.dart';

class CompleteRegistrationScreen extends StatefulWidget {
  const CompleteRegistrationScreen({super.key});

  @override
  State<CompleteRegistrationScreen> createState() => _CompleteRegistrationScreenState();
}

class _CompleteRegistrationScreenState extends State<CompleteRegistrationScreen> {
  final _nameCtrl     = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl  = TextEditingController();
  String _role        = 'customer';
  String _language    = 'en';
  bool _loading       = false;
  bool _showPw        = false;
  bool _showConfirm   = false;
  bool _hasPassword = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _checkPasswordSession();
  }

  void _checkPasswordSession() {
    final session = supabase.auth.currentSession;
    if (session == null) return;
    try {
      final parts = session.accessToken.split('.');
      if (parts.length >= 2) {
        final payload = parts[1];
        final normalized = base64Url.normalize(payload);
        final decoded = utf8.decode(base64Url.decode(normalized));
        final map = json.decode(decoded) as Map<String, dynamic>;
        final amr = map['amr'] as List<dynamic>?;
        if (amr != null && amr.contains('password')) {
          setState(() {
            _hasPassword = true;
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _submit() async {
    if (_loading) return;
    final name = _nameCtrl.text.trim();
    final password = _passwordCtrl.text;
    final confirm = _confirmCtrl.text;

    if (name.isEmpty) {
      setState(() => _error = 'Please enter your full name.');
      return;
    }
    if (password.isNotEmpty) {
      if (password.length < 8) {
        setState(() => _error = 'Password must be at least 8 characters.');
        return;
      }
      if (password != confirm) {
        setState(() => _error = 'Passwords do not match.');
        return;
      }
    }

    setState(() { _loading = true; _error = null; });
    try {
      await authService.completeRegistration(
        name: name,
        role: _role,
        language: _language,
        password: password.isNotEmpty ? password : null,
      );
      if (mounted) context.go('/home');
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              Text(
                'Complete Registration',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: kWaTeal,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Just a few more details to set up your profile',
                style: TextStyle(
                  fontSize: 14,
                  color: kNeutral500,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 28),

              // Full Name
              _buildInputField(
                label: 'Full name',
                hintText: 'Your full name',
                controller: _nameCtrl,
                prefixIcon: Icons.person_outline,
                keyboardType: TextInputType.name,
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 18),

              // Account Type
              _buildDropdownField(
                label: 'Account type',
                value: _role,
                prefixIcon: Icons.people_outline,
                items: const [
                  DropdownMenuItem(value: 'customer', child: Text('Customer')),
                  DropdownMenuItem(value: 'shop_owner', child: Text('Shop Owner')),
                ],
                onChanged: (val) => setState(() => _role = val!),
              ),
              const SizedBox(height: 18),

              // Language Preference
              _buildDropdownField(
                label: 'Preferred language',
                value: _language,
                prefixIcon: Icons.language_outlined,
                items: const [
                  DropdownMenuItem(value: 'en', child: Text('English')),
                  DropdownMenuItem(value: 'ar', child: Text('العربية')),
                ],
                onChanged: (val) => setState(() => _language = val!),
              ),
              const SizedBox(height: 18),

              if (!_hasPassword) ...[
                // Divider for password setup
                Row(
                  children: [
                    Expanded(child: Divider(color: isDark ? const Color(0xFF334155) : kNeutral200)),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 10),
                      child: Text(
                        'PASSWORD LOGIN (OPTIONAL)',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: kNeutral400, letterSpacing: 0.5),
                      ),
                    ),
                    Expanded(child: Divider(color: isDark ? const Color(0xFF334155) : kNeutral200)),
                  ],
                ),
                const SizedBox(height: 18),

                // Password
                _buildInputField(
                  label: 'Password (for password sign-in)',
                  hintText: 'Min. 8 characters (optional)',
                  controller: _passwordCtrl,
                  prefixIcon: Icons.lock_outline,
                  obscureText: !_showPw,
                  textInputAction: TextInputAction.next,
                  suffixIcon: GestureDetector(
                    onTap: () => setState(() => _showPw = !_showPw),
                    child: Icon(
                      _showPw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      size: 20,
                      color: kNeutral500,
                    ),
                  ),
                ),
                const SizedBox(height: 18),

                // Confirm Password
                _buildInputField(
                  label: 'Confirm password',
                  hintText: 'Repeat password',
                  controller: _confirmCtrl,
                  prefixIcon: Icons.vpn_key_outlined,
                  obscureText: !_showConfirm,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submit(),
                  suffixIcon: GestureDetector(
                    onTap: () => setState(() => _showConfirm = !_showConfirm),
                    child: Icon(
                      _showConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      size: 20,
                      color: kNeutral500,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Error Box
              if (_error != null) ...[
                _buildErrorAlert(_error!),
                const SizedBox(height: 20),
              ],

              // Submit Button
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kWaTeal,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  textStyle: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Inter',
                  ),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Complete Registration'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required String hintText,
    required TextEditingController controller,
    required IconData prefixIcon,
    bool obscureText = false,
    Widget? suffixIcon,
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
    void Function(String)? onSubmitted,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: kNeutral500,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : kNeutral100,
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Icon(prefixIcon, size: 18, color: kNeutral500),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: controller,
                  obscureText: obscureText,
                  keyboardType: keyboardType,
                  textInputAction: textInputAction,
                  onSubmitted: onSubmitted,
                  style: TextStyle(fontSize: 15, color: ThemeService.instance.isDarkMode ? Colors.white : kNeutral800, fontWeight: FontWeight.w500),
                  decoration: InputDecoration(
                    hintText: hintText,
                    hintStyle: const TextStyle(color: kNeutral400, fontWeight: FontWeight.w400),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
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

  Widget _buildDropdownField<T>({
    required String label,
    required T value,
    required IconData prefixIcon,
    required List<DropdownMenuItem<T>> items,
    required void Function(T?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: kNeutral500,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : kNeutral100,
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Icon(prefixIcon, size: 18, color: kNeutral500),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<T>(
                    value: value,
                    icon: const Icon(Icons.arrow_drop_down, color: kNeutral500),
                    isExpanded: true,
                    style: TextStyle(fontSize: 15, color: ThemeService.instance.isDarkMode ? Colors.white : kNeutral800, fontWeight: FontWeight.w500),
                    dropdownColor: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    onChanged: onChanged,
                    items: items,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
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
