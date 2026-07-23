import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../core/auth_service.dart';
import '../../core/supabase_client.dart';
import '../../theme/app_theme.dart';
import '../../theme/theme_service.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String phone;
  final String flow; // 'login', 'signup', 'reset', 'changePhone'
  final String? newPhone;

  const OtpVerificationScreen({
    super.key,
    required this.phone,
    required this.flow,
    this.newPhone,
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _loading = false;
  String? _error;
  int _countdown = 30;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    setState(() => _countdown = 30);
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 0) {
        setState(() => _countdown--);
      } else {
        _timer?.cancel();
      }
    });
  }

  Future<void> _resendOtp() async {
    if (_countdown > 0 || _loading) return;
    setState(() { _loading = true; _error = null; });
    try {
      final targetPhone = widget.flow == 'changePhone' ? widget.newPhone! : widget.phone;
      await authService.sendOtp(targetPhone);
      _startCountdown();
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.authVerificationCodeResent)),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    if (_loading) return;
    final code = _controllers.map((c) => c.text).join();
    if (code.length < 6) {
      setState(() => _error = 'Please enter the full 6-digit code.');
      return;
    }

    setState(() { _loading = true; _error = null; });
    try {
      if (widget.flow == 'changePhone') {
        await authService.verifyPhoneChange(widget.newPhone!, code);
        if (mounted) context.pop(true);
      } else {
        final OtpType type = OtpType.sms;
        final res = await authService.verifyOtp(widget.phone, code, type: type);
        
        if (widget.flow == 'reset') {
          if (mounted) context.pop(true);
        } else {
          // Check if user exists in public.users and has completed profile details
          final userId = res.user?.id;
          if (userId != null) {
            final userRecord = await supabase
                .from('users')
                .select('id, name')
                .eq('id', userId)
                .maybeSingle();

            if (mounted) {
              final name = userRecord?['name'] as String?;
              if (userRecord == null || name == null || name == 'User' || name.trim().isEmpty) {
                // Incomplete signup - redirect to complete registration
                context.go('/complete-registration');
              } else {
                // Already has a profile
                context.go('/home');
              }
            }
          } else {
            throw const AuthException('Verification succeeded but no user session was established.');
          }
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
    _timer?.cancel();
    for (var c in _controllers) {
      c.dispose();
    }
    for (var f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final l10n = AppLocalizations.of(context)!;
    final displayPhone = widget.flow == 'changePhone' ? widget.newPhone! : widget.phone;

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
              l10n.authVerifyPhone,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: kWaTeal,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.securityEnterVerificationCode(displayPhone),
              style: const TextStyle(
                fontSize: 14,
                color: kNeutral500,
                fontWeight: FontWeight.w500,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 36),

            // OTP Code Inputs
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(6, (index) {
                return SizedBox(
                  width: 45,
                  height: 55,
                  child: TextField(
                    controller: _controllers[index],
                    focusNode: _focusNodes[index],
                    autofocus: index == 0,
                    maxLength: 1,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : kNeutral800,
                    ),
                    decoration: InputDecoration(
                      counterText: '',
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      fillColor: isDark ? const Color(0xFF1E293B) : kNeutral100,
                      filled: true,
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(
                          color: isDark ? const Color(0xFF334155) : kNeutral300,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: kWaTeal, width: 2),
                      ),
                    ),
                    onChanged: (val) {
                      if (val.isNotEmpty) {
                        if (index < 5) {
                          _focusNodes[index + 1].requestFocus();
                        } else {
                          _focusNodes[index].unfocus();
                          _verify();
                        }
                      } else {
                        if (index > 0) {
                          _focusNodes[index - 1].requestFocus();
                        }
                      }
                    },
                  ),
                );
              }),
            ),
            const SizedBox(height: 24),

            // Error Alert
            if (_error != null) ...[
              _buildErrorAlert(_error!),
              const SizedBox(height: 24),
            ],

            // Submit Button
            ElevatedButton(
              onPressed: _loading ? null : _verify,
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
                  : Text(l10n.authVerifyCode),
            ),
            const SizedBox(height: 24),

            // Resend Countdown
            Center(
              child: _countdown > 0
                  ? Text(
                      l10n.securityResendIn(_countdown.toString()),
                      style: const TextStyle(
                        fontSize: 14,
                        color: kNeutral500,
                        fontWeight: FontWeight.w500,
                      ),
                    )
                  : GestureDetector(
                      onTap: _resendOtp,
                      child: Text(
                        l10n.securityResendOtp,
                        style: TextStyle(
                          color: kWaTeal,
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
            ),
          ],
        ),
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
