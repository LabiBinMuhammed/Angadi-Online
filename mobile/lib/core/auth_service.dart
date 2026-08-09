import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_client.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  User? get currentUser => supabase.auth.currentUser;
  Session? get currentSession => supabase.auth.currentSession;

  Stream<AuthState> get onAuthStateChange => supabase.auth.onAuthStateChange;

  String _normalizePhone(String phone) {
    String cleaned = phone.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    if (cleaned.isEmpty) return '';
    if (cleaned.startsWith('+')) return cleaned;
    if (cleaned.startsWith('00')) return '+' + cleaned.substring(2);
    if (cleaned.startsWith('0') && cleaned.length == 11) {
      return '+91' + cleaned.substring(1);
    }
    if (cleaned.length == 10) {
      return '+91' + cleaned;
    }
    if (cleaned.startsWith('91') && cleaned.length == 12) {
      return '+' + cleaned;
    }
    return '+' + cleaned;
  }

  Future<void> sendOtp(String phone) async {
    await supabase.auth.signInWithOtp(
      phone: _normalizePhone(phone),
    );
  }

  Future<AuthResponse> verifyOtp(String phone, String code, {OtpType type = OtpType.sms}) async {
    final response = await supabase.auth.verifyOTP(
      phone: _normalizePhone(phone),
      token: code,
      type: type,
    );
    
    // If logging in via sms, update last_login_at
    if (response.user != null && type == OtpType.sms) {
      try {
        await supabase
            .from('users')
            .update({'last_login_at': DateTime.now().toIso8601String()})
            .eq('id', response.user!.id);
      } catch (_) {}
    }
    
    return response;
  }

  Future<AuthResponse> signUp({
    String? email,
    String? phone,
    required String password,
    required String name,
    required String role,
    required String language,
    String? locationId,
  }) async {
    final Map<String, dynamic> data = {
      'name': name,
      'full_name': name,
      'role': role,
      'preferred_language': language,
    };

    AuthResponse response;

    if (email != null && email.trim().isNotEmpty) {
      response = await supabase.auth.signUp(
        email: email.trim(),
        password: password,
        data: data,
      );
    } else if (phone != null && phone.trim().isNotEmpty) {
      response = await supabase.auth.signUp(
        phone: _normalizePhone(phone),
        password: password,
        data: data,
      );
    } else {
      throw AuthException('Either email or phone must be provided');
    }

    if (response.user != null) {
      try {
        await supabase.from('users').update({
          'preferred_language': language,
        }).eq('id', response.user!.id);
      } catch (_) {}

      if (locationId != null && locationId.isNotEmpty) {
        try {
          await supabase.from('user_addresses').insert({
            'user_id': response.user!.id,
            'label': 'Home',
            'contact_name': name,
            'contact_phone': phone != null && phone.trim().isNotEmpty ? _normalizePhone(phone) : '0000000000',
            'address_line_1': 'Default Address',
            'location_id': locationId,
            'is_default': true,
            'is_active': true,
          });
        } catch (_) {}
      }
    }

    return response;
  }

  Future<AuthResponse> loginWithPassword(String identifier, String password) async {
    final isEmail = identifier.contains('@');
    final response = await supabase.auth.signInWithPassword(
      email: isEmail ? identifier.trim() : null,
      phone: isEmail ? null : _normalizePhone(identifier),
      password: password,
    );
    
    if (response.user != null) {
      try {
        await supabase
            .from('users')
            .update({
              'last_login_at': DateTime.now().toIso8601String(),
              'phone_verified': !isEmail,
              'email_verified': isEmail,
            })
            .eq('id', response.user!.id);
      } catch (_) {}
    }
    
    return response;
  }

  Future<void> sendPasswordResetEmail(String email) async {
    await supabase.auth.resetPasswordForEmail(email.trim());
  }

  Future<void> completeRegistration({
    required String name,
    required String role,
    required String language,
    String? password,
  }) async {
    final user = currentUser;
    if (user == null) throw Exception('No authenticated user found');

    // 1. Update Supabase Auth user metadata & optional password
    final attributes = UserAttributes(
      data: {
        'name': name,
        'full_name': name,
        'role': role,
      },
      password: password,
    );
    await supabase.auth.updateUser(attributes);

    // 2. Update public.users record
    await supabase.from('users').update({
      'name': name,
      'role': role,
      'phone_verified': true,
      'last_login_at': DateTime.now().toIso8601String(),
    }).eq('id', user.id);

    // 3. Update preferred language in users record
    try {
      await supabase.from('users').update({
        'preferred_language': language,
      }).eq('id', user.id);
    } catch (_) {}
  }

  Future<UserResponse> updatePassword(String password) async {
    return await supabase.auth.updateUser(
      UserAttributes(password: password),
    );
  }

  Future<UserResponse> updatePhone(String phone) async {
    return await supabase.auth.updateUser(
      UserAttributes(phone: _normalizePhone(phone)),
    );
  }

  Future<AuthResponse> verifyPhoneChange(String phone, String code) async {
    return await verifyOtp(phone, code, type: OtpType.phoneChange);
  }

  Future<void> signOut() async {
    await supabase.auth.signOut();
  }

  Future<void> signOutFromAllDevices() async {
    await supabase.auth.signOut(scope: SignOutScope.global);
  }
}

final authService = AuthService();
