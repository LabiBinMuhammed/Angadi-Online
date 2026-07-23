import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../core/auth_service.dart';
import '../../theme/app_theme.dart';
import '../../theme/theme_service.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _nameCtrl     = TextEditingController();
  final _phoneCtrl    = TextEditingController();
  final _emailCtrl    = TextEditingController();
  final _passwordCtrl = TextEditingController();
  
  bool _isPhoneMode = true;
  String _selectedLanguage = 'en';
  String _selectedRole = 'customer';
  
  bool _loading = false;
  bool _showPw = false;
  String? _error;
  String? _successInfo;
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

  bool _validatePassword(String pw) {
    if (pw.length < 8) return false;
    if (!pw.contains(RegExp(r'[A-Z]'))) return false;
    if (!pw.contains(RegExp(r'[a-z]'))) return false;
    if (!pw.contains(RegExp(r'[0-9]'))) return false;
    return true;
  }

  Future<void> _handleSignup() async {
    if (_loading) return;
    
    final name = _nameCtrl.text.trim();
    final password = _passwordCtrl.text;
    
    if (name.isEmpty) {
      setState(() => _error = 'Please enter your full name.');
      return;
    }

    if (_isPhoneMode) {
      if (_phoneCtrl.text.trim().isEmpty) {
        setState(() => _error = 'Please enter your phone number.');
        return;
      }
    } else {
      if (_emailCtrl.text.trim().isEmpty) {
        setState(() => _error = 'Please enter your email address.');
        return;
      }
      if (!_emailCtrl.text.contains('@')) {
        setState(() => _error = 'Please enter a valid email address.');
        return;
      }
    }

    if (!_validatePassword(password)) {
      setState(() => _error = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    setState(() { _loading = true; _error = null; _successInfo = null; });
    try {
      final phoneVal = _isPhoneMode ? _normalizePhone(_phoneCtrl.text.trim(), _selectedCountryCode) : null;
      final emailVal = _isPhoneMode ? null : _emailCtrl.text.trim();

      final res = await authService.signUp(
        email: emailVal,
        phone: phoneVal,
        password: password,
        name: name,
        role: _selectedRole,
        language: _selectedLanguage,
      );

      if (mounted) {
        var finalSession = res.session;
        if (finalSession == null) {
          try {
            final loginRes = await authService.loginWithPassword(
              _isPhoneMode ? phoneVal! : emailVal!,
              password,
            );
            finalSession = loginRes.session;
          } catch (_) {}
        }

        if (finalSession != null) {
          context.go('/home');
        } else {
          setState(() {
            _successInfo = _isPhoneMode 
                ? 'Registration successful! You can now log in.' 
                : 'Registration successful! Please check your email for a confirmation link.';
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

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: kWaTeal,
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          physics: const ClampingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Header Section (Back button, Greeting & Logo)
              Container(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          GestureDetector(
                            onTap: () => context.go('/login'),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.arrow_back, color: Colors.white, size: 16),
                                const SizedBox(width: 4),
                                Text(
                                  l10n.authSignInLink, // Back to login / Sign In
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            l10n.authCreateAccount, // "Sign Up"
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -1.0,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    // Storefront Logo Container
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.1),
                          width: 1.5,
                        ),
                      ),
                      child: const Icon(
                        Icons.storefront_rounded,
                        size: 40,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),

              // Bottom Sheet Form Card Container
              Container(
                constraints: BoxConstraints(
                  minHeight: MediaQuery.of(context).size.height - 220,
                ),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 16,
                      offset: const Offset(0, -8),
                    )
                  ],
                ),
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Full Name Input
                    _buildInputField(
                      label: l10n.authFullName,
                      hintText: 'John Doe',
                      controller: _nameCtrl,
                      prefixIcon: Icons.person_outline,
                      keyboardType: TextInputType.name,
                      textInputAction: TextInputAction.next,
                    ),
                    const SizedBox(height: 16),

                    // Preferred Language Select
                    _buildDropdownField(
                      label: l10n.authPreferredLanguage,
                      value: _selectedLanguage,
                      prefixIcon: Icons.language_outlined,
                      items: const [
                        DropdownMenuItem(value: 'en', child: Text('English')),
                        DropdownMenuItem(value: 'ar', child: Text('العربية (Arabic)')),
                        DropdownMenuItem(value: 'hi', child: Text('हिंदी (Hindi)')),
                        DropdownMenuItem(value: 'ml', child: Text('Malayalam')),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedLanguage = val);
                      },
                    ),
                    const SizedBox(height: 16),

                    // Account Type / Role Select
                    _buildDropdownField(
                      label: l10n.authAccountType,
                      value: _selectedRole,
                      prefixIcon: Icons.group_outlined,
                      items: [
                        DropdownMenuItem(value: 'customer', child: Text(l10n.authCustomerRole)),
                        DropdownMenuItem(value: 'shop_owner', child: Text(l10n.authShopOwnerRole)),
                      ],
                      onChanged: (val) {
                        if (val != null) setState(() => _selectedRole = val);
                      },
                    ),
                    const SizedBox(height: 20),

                    // Method Switcher Toggle
                    Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.all(4),
                      child: Row(
                        children: [
                          Expanded(
                            child: InkWell(
                              onTap: () => setState(() { _isPhoneMode = true; _error = null; }),
                              borderRadius: BorderRadius.circular(12),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                alignment: Alignment.center,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: _isPhoneMode ? kWaTeal : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  l10n.authPhoneLogin,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: _isPhoneMode ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF64748B)),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: InkWell(
                              onTap: () => setState(() { _isPhoneMode = false; _error = null; }),
                              borderRadius: BorderRadius.circular(12),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                alignment: Alignment.center,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: !_isPhoneMode ? kWaTeal : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  l10n.authEmailLogin,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: !_isPhoneMode ? Colors.white : (isDark ? Colors.white70 : const Color(0xFF64748B)),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    if (_isPhoneMode) ...[
                      // Phone Input
                      _buildInputField(
                        label: l10n.authPhone,
                        hintText: '98765 43210',
                        controller: _phoneCtrl,
                        prefixIcon: Icons.phone_android_outlined,
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.next,
                        countryCode: _selectedCountryCode,
                        onCountryCodeChanged: (val) {
                          if (val != null) setState(() => _selectedCountryCode = val);
                        },
                      ),
                    ] else ...[
                      // Email Input
                      _buildInputField(
                        label: l10n.authEmail,
                        hintText: 'you@example.com',
                        controller: _emailCtrl,
                        prefixIcon: Icons.mail_outline,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                      ),
                    ],
                    const SizedBox(height: 16),

                    // Password Input
                    _buildInputField(
                      label: l10n.authPassword,
                      hintText: '••••••••',
                      controller: _passwordCtrl,
                      prefixIcon: Icons.lock_outline,
                      obscureText: !_showPw,
                      textInputAction: TextInputAction.done,
                      onSubmitted: (_) => _handleSignup(),
                      suffixIcon: GestureDetector(
                        onTap: () => setState(() => _showPw = !_showPw),
                        child: Icon(
                          _showPw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          size: 20,
                          color: kNeutral500,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Success Box
                    if (_successInfo != null) ...[
                      _buildSuccessAlert(_successInfo!),
                      const SizedBox(height: 20),
                    ],

                    // Error Box
                    if (_error != null) ...[
                      _buildErrorAlert(_error!),
                      const SizedBox(height: 20),
                    ],

                    // Submit Button
                    ElevatedButton(
                      onPressed: _loading ? null : _handleSignup,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kWaTeal,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
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
                          : Text(l10n.authRegister),
                    ),
                    const SizedBox(height: 24),

                    // Footer Redirection
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          l10n.authAlreadyHaveAccount,
                          style: const TextStyle(color: kNeutral500, fontSize: 14, fontWeight: FontWeight.w500),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/login'),
                          child: Text(
                            l10n.authSignInLink,
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
    final isDark = ThemeService.instance.isDarkMode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white70 : const Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ]
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              if (countryCode != null && onCountryCodeChanged != null) ...[
                DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: countryCode,
                    dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                    style: TextStyle(
                      fontSize: 15,
                      color: isDark ? Colors.white : const Color(0xFF1E293B),
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
                  color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                ),
                const SizedBox(width: 8),
              ] else ...[
                Icon(prefixIcon, size: 18, color: isDark ? Colors.white60 : const Color(0xFF64748B)),
                const SizedBox(width: 12),
              ],
              Expanded(
                child: TextField(
                  controller: controller,
                  obscureText: obscureText,
                  keyboardType: keyboardType,
                  textInputAction: textInputAction,
                  onSubmitted: onSubmitted,
                  style: TextStyle(
                    fontSize: 15,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                    fontWeight: FontWeight.w500,
                  ),
                  decoration: InputDecoration(
                    hintText: hintText,
                    hintStyle: TextStyle(
                      color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                      fontWeight: FontWeight.w400,
                    ),
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

  Widget _buildDropdownField({
    required String label,
    required String value,
    required IconData prefixIcon,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
  }) {
    final isDark = ThemeService.instance.isDarkMode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white70 : const Color(0xFF475569),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
              width: 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ]
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Icon(prefixIcon, size: 18, color: isDark ? Colors.white60 : const Color(0xFF64748B)),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: value,
                    isExpanded: true,
                    dropdownColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                    style: TextStyle(
                      fontSize: 15,
                      color: isDark ? Colors.white : const Color(0xFF1E293B),
                      fontWeight: FontWeight.w500,
                    ),
                    items: items,
                    onChanged: onChanged,
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
