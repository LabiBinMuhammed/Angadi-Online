import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../core/supabase_client.dart';
import '../../theme/app_theme.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class PasswordStrength {
  final int score;
  final String label;
  final Color color;

  PasswordStrength({required this.score, required this.label, required this.color});
}

PasswordStrength _getPasswordStrength(String pw) {
  int score = 0;
  if (pw.length >= 4) score++;
  if (pw.length >= 8) score++;
  if (pw.contains(RegExp(r'[A-Z]')) && pw.contains(RegExp(r'[a-z]'))) score++;
  if (pw.contains(RegExp(r'[0-9]')) || pw.contains(RegExp(r'[^A-Za-z0-9]'))) score++;

  final map = [
    PasswordStrength(score: 0, label: 'Weak', color: const Color(0xFFEF4444)),
    PasswordStrength(score: 1, label: 'Weak', color: const Color(0xFFEF4444)),
    PasswordStrength(score: 2, label: 'Fair', color: const Color(0xFFF59E0B)),
    PasswordStrength(score: 3, label: 'Good', color: const Color(0xFF22C55E)),
    PasswordStrength(score: 4, label: 'Strong', color: const Color(0xFF15803D)),
  ];
  return map[score];
}

class _SignupScreenState extends State<SignupScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  
  bool _loading = false;
  bool _showPw = false;
  bool _showConfirm = false;
  String _role = 'customer';
  String? _error;

  Future<void> _signup() async {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text;
    final confirm = _confirmCtrl.text;

    if (name.isEmpty) {
      setState(() => _error = 'Please enter your full name.');
      return;
    }
    if (email.isEmpty) {
      setState(() => _error = 'Please enter your email address.');
      return;
    }
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
      await supabase.auth.signUp(
        email: email,
        password: password,
        data: {
          'name': name,
          'full_name': name,
          'role': _role,
        },
      );
      if (mounted) context.go('/home');
    } on AuthException catch (e) {
      if (e.message.contains('already registered') || e.message.contains('User already')) {
        setState(() => _error = 'This email is already registered. Try signing in instead.');
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
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kNeutral50,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Brand Hero Banner
            Container(
              height: 230,
              decoration: const BoxDecoration(
                color: kWaTeal,
              ),
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
                        color: Colors.white.withValues(alpha: 0.08),
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
                        color: Colors.white.withValues(alpha: 0.08),
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
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              )
                            ],
                          ),
                          child: const Icon(Icons.storefront, size: 36, color: kWaTeal),
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
                            color: Colors.white.withValues(alpha: 0.8),
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
                  const Text(
                    'Create account',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: kWaTeal,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    "Join Village Market — it's free",
                    style: TextStyle(
                      fontSize: 14,
                      color: kNeutral500,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Full name Input
                  _buildInputField(
                    label: 'Full name',
                    hintText: 'Your full name',
                    controller: _nameCtrl,
                    prefixIcon: Icons.person_outline,
                    keyboardType: TextInputType.name,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 18),

                  // Email Input
                  _buildInputField(
                    label: 'Email address',
                    hintText: 'you@example.com',
                    controller: _emailCtrl,
                    prefixIcon: Icons.mail_outline,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 18),

                  // Account Type dropdown
                  _buildRoleDropdownField(),
                  const SizedBox(height: 18),

                  // Password Input
                  _buildInputField(
                    label: 'Password',
                    hintText: 'Min. 8 characters',
                    controller: _passwordCtrl,
                    prefixIcon: Icons.lock_outline,
                    obscureText: !_showPw,
                    textInputAction: TextInputAction.next,
                    onChanged: (_) => setState(() {}),
                    suffixIcon: GestureDetector(
                      onTap: () => setState(() => _showPw = !_showPw),
                      child: Icon(
                        _showPw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        size: 20,
                        color: kNeutral500,
                      ),
                    ),
                  ),
                  
                  // Password Strength Meter
                  _buildPasswordStrengthMeter(_passwordCtrl.text),
                  const SizedBox(height: 18),

                  // Confirm Password Input
                  _buildInputField(
                    label: 'Confirm password',
                    hintText: 'Repeat password',
                    controller: _confirmCtrl,
                    prefixIcon: Icons.vpn_key_outlined,
                    obscureText: !_showConfirm,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _signup(),
                    onChanged: (_) => setState(() {}),
                    suffixIcon: GestureDetector(
                      onTap: () => setState(() => _showConfirm = !_showConfirm),
                      child: Icon(
                        _showConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        size: 20,
                        color: kNeutral500,
                      ),
                    ),
                  ),

                  // Password mismatch text
                  if (_confirmCtrl.text.isNotEmpty && _passwordCtrl.text != _confirmCtrl.text) ...[
                    const SizedBox(height: 6),
                    const Text(
                      "Passwords don't match",
                      style: TextStyle(
                        color: kDanger,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),

                  // Error Box
                  if (_error != null) ...[
                    _buildErrorAlert(_error!),
                    const SizedBox(height: 20),
                  ],

                  // Submit Button
                  ElevatedButton(
                    onPressed: _loading ? null : _signup,
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
                        : const Text('Create Account'),
                  ),
                  const SizedBox(height: 24),

                  // Footer Redirection
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        "Already have an account? ",
                        style: TextStyle(color: kNeutral500, fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                      GestureDetector(
                        onTap: () => context.go('/login'),
                        child: const Text(
                          'Sign in',
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
    void Function(String)? onChanged,
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
            color: kNeutral100,
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
                  onChanged: onChanged,
                  style: const TextStyle(fontSize: 15, color: kNeutral800, fontWeight: FontWeight.w500),
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

  Widget _buildRoleDropdownField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'ACCOUNT TYPE',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: kNeutral500,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          decoration: BoxDecoration(
            color: kNeutral100,
            borderRadius: BorderRadius.circular(12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              const Icon(Icons.people_outline, size: 18, color: kNeutral500),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _role,
                    icon: const Icon(Icons.arrow_drop_down, color: kNeutral500),
                    isExpanded: true,
                    style: const TextStyle(fontSize: 15, color: kNeutral800, fontWeight: FontWeight.w500),
                    dropdownColor: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    onChanged: (String? newValue) {
                      if (newValue != null) {
                        setState(() {
                          _role = newValue;
                        });
                      }
                    },
                    items: const [
                      DropdownMenuItem(
                        value: 'customer',
                        child: Text('Customer'),
                      ),
                      DropdownMenuItem(
                        value: 'shop_owner',
                        child: Text('Shop Owner'),
                      ),
                      DropdownMenuItem(
                        value: 'admin',
                        child: Text('Administrator'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordStrengthMeter(String password) {
    if (password.isEmpty) return const SizedBox.shrink();

    final strength = _getPasswordStrength(password);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: Row(
                children: List.generate(4, (index) {
                  final barIndex = index + 1;
                  final isActive = barIndex <= strength.score;
                  return Expanded(
                    child: Container(
                      height: 4,
                      margin: EdgeInsets.only(
                        left: index > 0 ? 2 : 0,
                        right: index < 3 ? 2 : 0,
                      ),
                      decoration: BoxDecoration(
                        color: isActive ? strength.color : kNeutral200,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              strength.label,
              style: TextStyle(
                color: strength.color,
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
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
