import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/auth_service.dart';
import '../../core/supabase_client.dart';
import '../../theme/app_theme.dart';
import '../../theme/theme_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneCtrl    = TextEditingController();
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _isPhoneMode = true;
  bool _loading = false;
  bool _showPw = false;
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

  Future<void> _handleLogin() async {
    if (_loading) return;
    setState(() { _loading = true; _error = null; });
    try {
      final identifier = _isPhoneMode 
          ? _normalizePhone(_phoneCtrl.text.trim(), _selectedCountryCode)
          : _emailCtrl.text.trim();
      
      if (_isPhoneMode) {
        if (_phoneCtrl.text.trim().isEmpty) {
          throw const AuthException('Please enter your phone number.');
        }
      } else {
        if (_emailCtrl.text.trim().isEmpty) {
          throw const AuthException('Please enter your email address.');
        }
        if (!_emailCtrl.text.contains('@')) {
          throw const AuthException('Please enter a valid email address.');
        }
      }

      if (_passwordCtrl.text.isEmpty) {
        throw const AuthException('Please enter your password.');
      }

      final res = await authService.loginWithPassword(identifier, _passwordCtrl.text);
      if (mounted) {
        final userId = res.user?.id;
        if (userId != null) {
          final userRecord = await supabase
              .from('users')
              .select('id, name')
              .eq('id', userId)
              .maybeSingle();
          final name = userRecord?['name'] as String?;
          if (userRecord == null || name == null || name == 'User' || name.trim().isEmpty) {
            context.go('/complete-registration');
            return;
          }
        }
        context.go('/home');
      }
    } on AuthException catch (e) {
      if (e.message.contains('Invalid login credentials')) {
        setState(() => _error = _isPhoneMode 
            ? 'Incorrect phone number or password. Please try again.'
            : 'Incorrect email or password. Please try again.');
      } else {
        setState(() => _error = e.message);
      }
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
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Brand Hero Banner
            Container(
              height: 230,
              decoration: BoxDecoration(color: kWaTeal),
              child: Stack(
                children: [
                  Positioned(
                    top: -40,
                    right: -40,
                    child: Container(
                      width: 160,
                      height: 160,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withAlpha(20),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -30,
                    left: 20,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withAlpha(20),
                      ),
                    ),
                  ),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withAlpha(25),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              )
                            ],
                          ),
                          child: Icon(Icons.storefront, size: 36, color: kWaTeal),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Village Market',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "Your community's local marketplace",
                          style: TextStyle(
                            color: Colors.white.withAlpha(204),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Form Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Welcome back',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: kWaTeal,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const SizedBox(height: 4),
                  const Text(
                    'Sign in to your Village Market account',
                    style: TextStyle(
                      fontSize: 14,
                      color: kNeutral500,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Login Method Toggle
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
                            onTap: () => setState(() { _isPhoneMode = true; _error = null; }),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              alignment: Alignment.center,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: _isPhoneMode ? kWaTeal : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'Phone Number',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: _isPhoneMode ? Colors.white : (isDark ? Colors.white70 : kNeutral700),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: InkWell(
                            onTap: () => setState(() { _isPhoneMode = false; _error = null; }),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              alignment: Alignment.center,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: !_isPhoneMode ? kWaTeal : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'Email Address',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: !_isPhoneMode ? Colors.white : (isDark ? Colors.white70 : kNeutral700),
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
                      textInputAction: TextInputAction.next,
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
                    // Email Input
                    _buildInputField(
                      label: 'Email address',
                      hintText: 'you@example.com',
                      controller: _emailCtrl,
                      prefixIcon: Icons.mail_outline,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                    ),
                  ],
                  const SizedBox(height: 18),

                  // Password Input
                  _buildInputField(
                    label: 'Password',
                    hintText: '••••••••',
                    controller: _passwordCtrl,
                    prefixIcon: Icons.lock_outline,
                    obscureText: !_showPw,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _handleLogin(),
                    suffixIcon: GestureDetector(
                      onTap: () => setState(() => _showPw = !_showPw),
                      child: Icon(
                        _showPw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        size: 20,
                        color: kNeutral500,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerRight,
                    child: GestureDetector(
                      onTap: () => context.push('/forgot-password'),
                      child: Text(
                        'Forgot Password?',
                        style: TextStyle(
                          color: kWaTeal,
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Error Box
                  if (_error != null) ...[
                    _buildErrorAlert(_error!),
                    const SizedBox(height: 20),
                  ],

                  // Submit Button
                  ElevatedButton(
                    onPressed: _loading ? null : _handleLogin,
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
                        : const Text('Sign In'),
                  ),
                  const SizedBox(height: 24),

                  // Footer Redirection
                  Wrap(
                    alignment: WrapAlignment.center,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Text(
                        "Don't have an account? ",
                        style: TextStyle(color: kNeutral500, fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                      GestureDetector(
                        onTap: () => context.push('/signup'),
                        child: Text(
                          'Create one',
                          style: TextStyle(
                            color: kWaTeal,
                            fontWeight: FontWeight.w700,
                            fontSize: 14,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
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
