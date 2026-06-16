import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/auth_service.dart';
import '../../theme/app_theme.dart';
import '../../theme/theme_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _phoneCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl  = TextEditingController();
  
  int _step = 1; // 1: Input phone, 2: Reset password (after OTP success)
  bool _loading = false;
  bool _showPw = false;
  bool _showConfirm = false;
  String? _error;
  String _selectedCountryCode = '+91';

  String _normalizePhone(String phone, String countryCode) {
    String cleaned = phone.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('00')) return '+' + cleaned.substring(2);
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    final codeWithoutPlus = countryCode.replaceAll('+', '');
    if (cleaned.startsWith(codeWithoutPlus)) {
      return '+' + cleaned;
    }
    return countryCode + cleaned;
  }

  Future<void> _sendOtp() async {
    if (_loading) return;
    final rawPhone = _phoneCtrl.text.trim();
    if (rawPhone.isEmpty) {
      setState(() => _error = 'Please enter your phone number.');
      return;
    }
    final phone = _normalizePhone(rawPhone, _selectedCountryCode);

    setState(() { _loading = true; _error = null; });
    try {
      await authService.sendOtp(phone);
      if (mounted) {
        // Push OTP verification screen and wait for result
        final verified = await context.push<bool>('/otp-verification', extra: {
          'phone': phone,
          'flow': 'reset',
        });
        
        if (verified == true) {
          setState(() {
            _step = 2; // Transition to password reset input
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

  Future<void> _resetPassword() async {
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

    setState(() { _loading = true; _error = null; });
    try {
      await authService.updatePassword(password);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password updated successfully!')),
        );
        context.go('/home');
      }
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
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: isDark ? Colors.white : kNeutral800),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),
            Text(
              _step == 1 ? 'Reset Password' : 'Choose New Password',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: kWaTeal,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              _step == 1
                  ? 'Enter your phone number to receive a verification code'
                  : 'Enter a strong, new password for your account',
              style: const TextStyle(
                fontSize: 14,
                color: kNeutral500,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 28),

            if (_step == 1) ...[
              // Step 1: Phone Input
              _buildInputField(
                label: 'Phone number',
                hintText: '98765 43210',
                controller: _phoneCtrl,
                prefixIcon: Icons.phone_android_outlined,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _sendOtp(),
                countryCode: _selectedCountryCode,
                onCountryCodeChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _selectedCountryCode = val;
                    });
                  }
                },
              ),
            ] else ...[
              // Step 2: New Password Inputs
              _buildInputField(
                label: 'New password',
                hintText: 'Min. 8 characters',
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
              _buildInputField(
                label: 'Confirm new password',
                hintText: 'Repeat password',
                controller: _confirmCtrl,
                prefixIcon: Icons.vpn_key_outlined,
                obscureText: !_showConfirm,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _resetPassword(),
                suffixIcon: GestureDetector(
                  onTap: () => setState(() => _showConfirm = !_showConfirm),
                  child: Icon(
                    _showConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 20,
                    color: kNeutral500,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),

            // Error Box
            if (_error != null) ...[
              _buildErrorAlert(_error!),
              const SizedBox(height: 20),
            ],

            // Submit Button
            ElevatedButton(
              onPressed: _loading ? null : (_step == 1 ? _sendOtp : _resetPassword),
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
                  : Text(_step == 1 ? 'Send OTP Code' : 'Update Password'),
            ),
          ],
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
    String? countryCode,
    void Function(String?)? onCountryCodeChanged,
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
              if (countryCode != null && onCountryCodeChanged != null) ...[
                DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: countryCode,
                    dropdownColor: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : Colors.white,
                    style: TextStyle(
                      fontSize: 15,
                      color: ThemeService.instance.isDarkMode ? Colors.white : kNeutral800,
                      fontWeight: FontWeight.w600,
                    ),
                    items: const [
                      DropdownMenuItem(value: '+91', child: Text('🇮🇳 +91')),
                      DropdownMenuItem(value: '+971', child: Text('🇦🇪 +971')),
                      DropdownMenuItem(value: '+966', child: Text('🇸🇦 +966')),
                      DropdownMenuItem(value: '+968', child: Text('🇴🇲 +968')),
                      DropdownMenuItem(value: '+974', child: Text('🇶🇦 +974')),
                      DropdownMenuItem(value: '+973', child: Text('🇧🇭 +973')),
                      DropdownMenuItem(value: '+965', child: Text('🇰🇼 +965')),
                      DropdownMenuItem(value: '+1', child: Text('🇺🇸 +1')),
                      DropdownMenuItem(value: '+44', child: Text('🇬🇧 +44')),
                    ],
                    onChanged: onCountryCodeChanged,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 1,
                  height: 20,
                  color: kNeutral300,
                ),
                const SizedBox(width: 8),
              ] else ...[
                Icon(prefixIcon, size: 18, color: kNeutral500),
                const SizedBox(width: 12),
              ],
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
