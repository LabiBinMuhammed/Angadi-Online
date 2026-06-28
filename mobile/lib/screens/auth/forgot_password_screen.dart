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
  final _emailCtrl    = TextEditingController();
  
  bool _isPhoneMode = false;
  bool _loading = false;
  String? _error;
  String? _info;
  bool _success = false;
  String _selectedCountryCode = '+91';

  Future<void> _handleReset() async {
    if (_loading) return;
    setState(() { _error = null; _info = null; });

    if (_isPhoneMode) {
      // Phone Accounts: Show placeholder alert
      setState(() {
        _info = 'Phone password reset will be available in a future update.';
      });
      return;
    }

    final email = _emailCtrl.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Please enter your email address.');
      return;
    }
    if (!email.contains('@')) {
      setState(() => _error = 'Please enter a valid email address.');
      return;
    }

    setState(() { _loading = true; });
    try {
      await authService.sendPasswordResetEmail(email);
      setState(() {
        _success = true;
      });
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
    _emailCtrl.dispose();
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
              'Reset Password',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: kWaTeal,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              !_success
                  ? 'Enter your details to receive password reset instructions'
                  : 'Check your inbox for password reset instructions',
              style: const TextStyle(
                fontSize: 14,
                color: kNeutral500,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 28),

            if (!_success) ...[
              // Reset Method Toggle
              Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : kNeutral100,
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() { _isPhoneMode = false; _error = null; _info = null; }),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: !_isPhoneMode ? kWaTeal : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Email Accounts',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: !_isPhoneMode ? Colors.white : (isDark ? Colors.white70 : kNeutral700),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() { _isPhoneMode = true; _error = null; _info = null; }),
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _isPhoneMode ? kWaTeal : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Phone Accounts',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: _isPhoneMode ? Colors.white : (isDark ? Colors.white70 : kNeutral700),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              if (_isPhoneMode) ...[
                // Phone Input
                _buildInputField(
                  label: 'Phone number',
                  hintText: '98765 43210',
                  controller: _phoneCtrl,
                  prefixIcon: Icons.phone_android_outlined,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _handleReset(),
                  countryCode: _selectedCountryCode,
                  onCountryCodeChanged: (val) {
                    if (val != null) setState(() => _selectedCountryCode = val);
                  },
                ),
              ] else ...[
                // Email Input
                _buildInputField(
                  label: 'Email address',
                  hintText: 'you@example.com',
                  controller: _emailCtrl,
                  prefixIcon: Icons.mail_outline,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _handleReset(),
                ),
              ],
              const SizedBox(height: 24),

              // Info Box
              if (_info != null) ...[
                _buildInfoAlert(_info!),
                const SizedBox(height: 20),
              ],

              // Error Box
              if (_error != null) ...[
                _buildErrorAlert(_error!),
                const SizedBox(height: 20),
              ],

              // Submit Button
              ElevatedButton(
                onPressed: _loading ? null : _handleReset,
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
                    : Text(_isPhoneMode ? 'Reset Password' : 'Send Reset Link'),
              ),
            ] else ...[
              // Success Screen
              const SizedBox(height: 10),
              Container(
                alignment: Alignment.center,
                padding: const EdgeInsets.all(12),
                child: Icon(Icons.check_circle_outline, size: 64, color: kWaTeal),
              ),
              const SizedBox(height: 12),
              _buildSuccessAlert(
                'A password reset link has been successfully sent to ${_emailCtrl.text.trim()}. Please check your inbox.',
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => context.go('/login'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: kWaTeal,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Back to Login'),
              ),
            ],
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

  Widget _buildInfoAlert(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFCD34D)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: Color(0xFF92400E), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: Color(0xFF92400E),
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

  Widget _buildSuccessAlert(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFDCFCE7),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF86EFAC)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
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
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
