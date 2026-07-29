import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../core/auth_service.dart';
import '../../core/supabase_client.dart';
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

  List<Map<String, dynamic>> _locations = [];
  String? _selectedLocationId;
  bool _loadingLocations = true;

  @override
  void initState() {
    super.initState();
    _loadLocations();
  }

  Future<void> _loadLocations() async {
    try {
      final res = await supabase.from('locations').select('*').order('name');
      if (mounted) {
        setState(() {
          _locations = List<Map<String, dynamic>>.from(res as List);
          if (_locations.isNotEmpty) {
            _selectedLocationId = _locations[0]['id'] as String;
          }
          _loadingLocations = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingLocations = false);
      }
    }
  }

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
        locationId: _selectedLocationId,
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

  bool _agreeTerms = true;

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Circular Back Arrow Button
              GestureDetector(
                onTap: () {
                  if (Navigator.of(context).canPop()) {
                    context.pop();
                  } else {
                    context.go('/intro');
                  }
                },
                child: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.arrow_back,
                    size: 20,
                    color: isDark ? Colors.white : const Color(0xFF1E293B),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Title and Subtitle
              Text(
                'Sign Up Your Account',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF1A1A1A),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Join Angadi Online today to start shopping fresh groceries from local vendors.',
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF71717A),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),

              // Full Name Input
              _buildInputField(
                label: '',
                hintText: 'Full Name',
                controller: _nameCtrl,
                prefixIcon: Icons.person_outline,
                keyboardType: TextInputType.name,
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 14),

              // Preferred Language Select
              _buildDropdownField(
                label: '',
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
              const SizedBox(height: 14),

              if (_locations.isNotEmpty) ...[
                _buildDropdownField(
                  label: '',
                  value: _selectedLocationId ?? (_locations.first['id'] as String),
                  prefixIcon: Icons.location_on_outlined,
                  items: _locations.map((loc) {
                    return DropdownMenuItem<String>(
                      value: loc['id'] as String,
                      child: Text(loc['name'] as String? ?? ''),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedLocationId = val);
                  },
                ),
                const SizedBox(height: 14),
              ],

              // Method Switcher Toggle (Phone / Email)
              Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(99),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () => setState(() { _isPhoneMode = true; _error = null; }),
                        borderRadius: BorderRadius.circular(99),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _isPhoneMode ? const Color(0xFF2E5B28) : Colors.transparent,
                            borderRadius: BorderRadius.circular(99),
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
                        borderRadius: BorderRadius.circular(99),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          alignment: Alignment.center,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: !_isPhoneMode ? const Color(0xFF2E5B28) : Colors.transparent,
                            borderRadius: BorderRadius.circular(99),
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
              const SizedBox(height: 14),

              if (_isPhoneMode) ...[
                _buildInputField(
                  label: '',
                  hintText: 'Phone Number',
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
                _buildInputField(
                  label: '',
                  hintText: 'Email Address',
                  controller: _emailCtrl,
                  prefixIcon: Icons.mail_outline,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                ),
              ],
              const SizedBox(height: 14),

              // Password Input
              _buildInputField(
                label: '',
                hintText: 'Password',
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
                    color: const Color(0xFF94A3B8),
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // I Agree to Terms & Conditions Checkbox
              Row(
                children: [
                  SizedBox(
                    width: 24,
                    height: 24,
                    child: Checkbox(
                      value: _agreeTerms,
                      onChanged: (val) => setState(() => _agreeTerms = val ?? true),
                      activeColor: const Color(0xFF2E5B28),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        text: 'I agree to the ',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: isDark ? Colors.white70 : const Color(0xFF475569),
                        ),
                        children: const [
                          TextSpan(
                            text: 'terms & conditions',
                            style: TextStyle(
                              color: Color(0xFF2E5B28),
                              fontWeight: FontWeight.bold,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              if (_successInfo != null) ...[
                _buildSuccessAlert(_successInfo!),
                const SizedBox(height: 16),
              ],

              if (_error != null) ...[
                _buildErrorAlert(_error!),
                const SizedBox(height: 16),
              ],

              // Primary Sign Up Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: (_loading || !_agreeTerms) ? null : _handleSignup,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2E5B28),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: const StadiumBorder(),
                    textStyle: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
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
                      : const Text('Sign Up'),
                ),
              ),
              const SizedBox(height: 24),

              // Divider with 'or'
              Row(
                children: [
                  Expanded(child: Divider(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 12),
                    child: Text('or', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
                  ),
                  Expanded(child: Divider(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0))),
                ],
              ),
              const SizedBox(height: 20),

              // Social Icons (Google & Facebook)
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
                      ],
                    ),
                    child: const Center(
                      child: Text('G', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Color(0xFF4285F4))),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
                      ],
                    ),
                    child: const Center(
                      child: Icon(Icons.facebook, size: 22, color: Color(0xFF1877F2)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 28),

              // Footer Sign In Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Already Have An Account? ',
                    style: TextStyle(color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), fontSize: 14, fontWeight: FontWeight.w500),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: const Text(
                      'Sign In',
                      style: TextStyle(
                        color: Color(0xFF2E5B28),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
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
