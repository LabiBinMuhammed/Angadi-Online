import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late Future<_Data> _future;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<_Data> _fetch() async {
    final userId = supabase.auth.currentUser!.id;
    final results = await Future.wait([
      supabase.from('users').select('name, phone, role').eq('id', userId).single(),
      supabase.from('user_profiles').select('email, profile_image_url, gender, preferred_language').eq('user_id', userId).maybeSingle(),
    ]);
    return _Data(
      user:    results[0] as Map<String, dynamic>,
      profile: results[1] != null ? results[1] as Map<String, dynamic> : null,
    );
  }

  Future<void> _signOut() async {
    await supabase.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/profile/settings'),
            tooltip: 'Settings',
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            onPressed: _signOut,
            tooltip: 'Sign out',
          ),
        ],
      ),
      body: FutureBuilder<_Data>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final d        = snapshot.data!;
          final name     = d.user['name']  as String? ?? '—';
          final phone    = d.user['phone'] as String? ?? '';
          final role     = d.user['role']  as String? ?? 'customer';
          final email    = d.profile?['email'] as String?;
          final imageUrl = d.profile?['profile_image_url'] as String?;
          final language = d.profile?['preferred_language'] as String?;
          final isVendor = role == 'shop_owner' || role == 'admin';
          final isAdmin  = role == 'admin';

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // ── Avatar + Name ─────────────────────────────────────────
                CircleAvatar(
                  radius: 44,
                  backgroundColor: kWaTeal,
                  backgroundImage: imageUrl != null ? NetworkImage(imageUrl) : null,
                  child: imageUrl == null
                      ? Text(name[0].toUpperCase(),
                          style: const TextStyle(fontSize: 32, color: Colors.white, fontWeight: FontWeight.w800))
                      : null,
                ),
                const SizedBox(height: 12),
                Text(name,  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                Text(phone, style: const TextStyle(color: Color(0xFF64748B))),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: kBrand100,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(role.toUpperCase(),
                      style: const TextStyle(color: kBrand700, fontSize: 11, fontWeight: FontWeight.w700)),
                ),
                const SizedBox(height: 24),

                // ── Info rows ─────────────────────────────────────────────
                Card(
                  child: Column(children: [
                    if (email != null)
                      ListTile(
                        leading: const Icon(Icons.email_outlined, color: Color(0xFF075E54)),
                        title: Text(email),
                      ),
                    if (language != null)
                      ListTile(
                        leading: const Icon(Icons.language, color: Color(0xFF075E54)),
                        title: Text(language),
                      ),
                  ]),
                ),
                const SizedBox(height: 12),

                // ── Customer actions ──────────────────────────────────────
                Card(
                  child: Column(children: [
                    ListTile(
                      leading: const Icon(Icons.location_on_outlined, color: Color(0xFF075E54)),
                      title: const Text('My Addresses'),
                      trailing: const Icon(Icons.chevron_right, color: Color(0xFF94A3B8)),
                      onTap: () => context.push('/profile/addresses'),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.receipt_long_outlined, color: Color(0xFF075E54)),
                      title: const Text('My Orders'),
                      trailing: const Icon(Icons.chevron_right, color: Color(0xFF94A3B8)),
                      onTap: () => context.go('/orders'),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.notifications_outlined, color: Color(0xFF075E54)),
                      title: const Text('Notifications'),
                      trailing: const Icon(Icons.chevron_right, color: Color(0xFF94A3B8)),
                      onTap: () => context.go('/notifications'),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      leading: const Icon(Icons.settings_outlined, color: Color(0xFF075E54)),
                      title: const Text('Settings'),
                      trailing: const Icon(Icons.chevron_right, color: Color(0xFF94A3B8)),
                      onTap: () => context.push('/profile/settings'),
                    ),
                  ]),
                ),
                const SizedBox(height: 12),

                // ── Vendor Panel ──────────────────────────────────────────
                if (isVendor)
                  Card(
                    color: const Color(0xFFF0FDF4),
                    child: Column(children: [
                      ListTile(
                        leading: const Text('🏪', style: TextStyle(fontSize: 22)),
                        title: const Text('Vendor Panel', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF128C7E))),
                        subtitle: const Text('Manage your shop, items & orders'),
                        trailing: const Icon(Icons.chevron_right, color: Color(0xFF128C7E)),
                        onTap: () => context.push('/vendor/dashboard'),
                      ),
                    ]),
                  ),
                if (isVendor) const SizedBox(height: 12),

                // ── Admin Panel ───────────────────────────────────────────
                if (isAdmin)
                  Card(
                    color: const Color(0xFFF0F9FF),
                    child: Column(children: [
                      ListTile(
                        leading: const Text('🛠️', style: TextStyle(fontSize: 22)),
                        title: const Text('Admin Panel', style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF075E54))),
                        subtitle: const Text('System administration'),
                        trailing: const Icon(Icons.chevron_right, color: Color(0xFF075E54)),
                        onTap: () => context.push('/admin/dashboard'),
                      ),
                    ]),
                  ),
                if (isAdmin) const SizedBox(height: 12),

                // ── Sign out ──────────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.logout, color: Color(0xFFEF4444)),
                    label: const Text('Sign Out', style: TextStyle(color: Color(0xFFEF4444))),
                    style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFFEF4444))),
                    onPressed: _signOut,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _Data {
  final Map<String, dynamic> user;
  final Map<String, dynamic>? profile;
  _Data({required this.user, this.profile});
}
