import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';
import '../../../widgets/directional_huge_icon.dart';

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
    ThemeService.instance.addListener(_onThemeChanged);
  }

  @override
  void dispose() {
    ThemeService.instance.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<_Data> _fetch() async {
    final userId = supabase.auth.currentUser!.id;
    final results = await Future.wait([
      supabase.from('users').select('name, phone, role').eq('id', userId).single(),
      supabase.from('user_profiles').select('email, profile_image_url, gender, preferred_language, date_of_birth').eq('user_id', userId).maybeSingle(),
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
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
      body: FutureBuilder<_Data>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return Center(child: CircularProgressIndicator(color: kWaGreenDark));
          }
          final d        = snapshot.data!;
          final name     = d.user['name']  as String? ?? l10n.guestUserLabel;
          final phone    = d.user['phone'] as String? ?? '';
          final role     = d.user['role']  as String? ?? 'customer';
          final email    = d.profile?['email'] as String?;
          final imageUrl = d.profile?['profile_image_url'] as String?;
          final gender   = d.profile?['gender'] as String?;
          final birthday = d.profile?['date_of_birth'] as String?;
          final language = d.profile?['preferred_language'] as String?;
          
          final isVendor = role == 'shop_owner' || role == 'admin';
          final isAdmin  = role == 'admin';

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Title ──────────────────────────────────────────────────
                  Text(
                    l10n.myProfileTitle,
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: isDark ? Colors.white : kNeutral900,
                      letterSpacing: -1,
                    ),
                  ),
                  const SizedBox(height: 32),

                  // ── Profile Card (Green Gradient) ──────────────────────────
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(32),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1E4D1E), Color(0xFF2B5A2B)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF1E4D1E).withValues(alpha: 0.2),
                          blurRadius: 30,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: imageUrl != null && imageUrl.isNotEmpty
                              ? ClipOval(child: Image.network(imageUrl, fit: BoxFit.cover))
                              : Center(
                                  child: Text(
                                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                                    style: const TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF1E4D1E),
                                    ),
                                  ),
                                ),
                        ),
                        const SizedBox(width: 20),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  letterSpacing: -0.5,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                phone.isEmpty ? l10n.noPhoneNumberLabel : phone,
                                style: const TextStyle(
                                  fontSize: 15,
                                  color: Color(0xFFB5DEB5),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Text(
                                  role.toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // ── Personal Info Grid (2x2) ───────────────────────────────
                  _buildSectionTitle(l10n.personalInfoSection, isDark),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildInfoCard(
                          label: l10n.emailLabel,
                          value: email ?? '—',
                          icon: HugeIcons.strokeRoundedMail01,
                          isDark: isDark,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildInfoCard(
                          label: l10n.genderLabel,
                          value: gender ?? '—',
                          icon: HugeIcons.strokeRoundedUser,
                          isDark: isDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildInfoCard(
                          label: l10n.birthdayLabel,
                          value: birthday ?? '—',
                          icon: HugeIcons.strokeRoundedCalendar03,
                          isDark: isDark,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildInfoCard(
                          label: l10n.languageLabel,
                          value: language ?? '—',
                          icon: HugeIcons.strokeRoundedInternet,
                          isDark: isDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // ── Preferences List ───────────────────────────────────────
                  _buildSectionTitle(l10n.preferencesSection, isDark),
                  const SizedBox(height: 16),
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? kNeutral800 : Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.03),
                          blurRadius: 20,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      children: [
                        _buildLinkItem(
                          label: l10n.myAddressesTitle,
                          icon: HugeIcons.strokeRoundedLocation01,
                          color: const Color(0xFF3B82F6),
                          bg: isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                          isDark: isDark,
                          onTap: () => context.push('/profile/addresses'),
                        ),
                        _buildLinkItem(
                          label: l10n.myOrdersTitle,
                          icon: HugeIcons.strokeRoundedReceiptText,
                          color: const Color(0xFF8B5CF6),
                          bg: isDark ? const Color(0xFF1E293B) : const Color(0xFFF5F3FF),
                          isDark: isDark,
                          onTap: () => context.go('/orders'),
                        ),
                        _buildLinkItem(
                          label: l10n.notificationsTitle,
                          icon: HugeIcons.strokeRoundedNotification01,
                          color: const Color(0xFFF59E0B),
                          bg: isDark ? const Color(0xFF1E293B) : const Color(0xFFFFFBEB),
                          isDark: isDark,
                          onTap: () => context.go('/notifications'),
                        ),
                        _buildLinkItem(
                          label: l10n.pinnedShopsTitle,
                          icon: HugeIcons.strokeRoundedBookmark01,
                          color: const Color(0xFFEC4899),
                          bg: isDark ? const Color(0xFF1E293B) : const Color(0xFFFDF2F8),
                          isDark: isDark,
                          onTap: () => context.push('/profile/pinned-shops'),
                        ),
                        _buildLinkItem(
                          label: l10n.recentPurchasesLabel,
                          icon: HugeIcons.strokeRoundedClock01,
                          color: const Color(0xFF14B8A6),
                          bg: isDark ? const Color(0xFF1E293B) : const Color(0xFFF0FDFA),
                          isDark: isDark,
                          onTap: () => context.push('/profile/recent-purchases'),
                        ),
                        _buildLinkItem(
                          label: l10n.favoriteProductsTitle,
                          icon: HugeIcons.strokeRoundedFavourite,
                          color: const Color(0xFFEF4444),
                          bg: isDark ? const Color(0xFF1E293B) : const Color(0xFFFEF2F2),
                          isDark: isDark,
                          onTap: () => context.push('/profile/favorites'),
                        ),
                        _buildLinkItem(
                          label: l10n.purchaseHistoryLabel,
                          icon: HugeIcons.strokeRoundedInvoice,
                          color: const Color(0xFF6366F1),
                          bg: isDark ? const Color(0xFF1E293B) : const Color(0xFFEEF2FF),
                          isDark: isDark,
                          onTap: () => context.push('/profile/purchase-history'),
                        ),
                        _buildLinkItem(
                          label: l10n.settingsTitle,
                          icon: HugeIcons.strokeRoundedSettings01,
                          color: const Color(0xFF64748B),
                          bg: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                          isDark: isDark,
                          onTap: () => context.push('/profile/settings'),
                        ),
                        _buildLinkItem(
                          label: l10n.platformFeedbackLabel,
                          icon: HugeIcons.strokeRoundedChat01,
                          color: const Color(0xFF10B981),
                          bg: isDark ? const Color(0xFF1E293B) : const Color(0xFFECFDF5),
                          isDark: isDark,
                          onTap: () => context.push('/profile/feedback'),
                        ),
                        ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF334155) : const Color(0xFFFFFBEB),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            alignment: Alignment.center,
                            child: HugeIcon(
                              icon: isDark ? HugeIcons.strokeRoundedMoon : HugeIcons.strokeRoundedSun02,
                              color: isDark ? const Color(0xFFF1F5F9) : const Color(0xFFF59E0B),
                              size: 24,
                            ),
                          ),
                          title: Text(
                            'Dark Mode',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: isDark ? Colors.white : kNeutral900,
                            ),
                          ),
                          trailing: Switch(
                            value: isDark,
                            activeColor: Colors.white,
                            activeTrackColor: kWaGreen,
                            inactiveThumbColor: Colors.white,
                            inactiveTrackColor: const Color(0xFFCBD5E1),
                            trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
                            onChanged: (val) {
                              ThemeService.instance.toggleTheme();
                            },
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── Management Section ─────────────────────────────────────
                  if (isVendor) ...[
                    const SizedBox(height: 32),
                    _buildSectionTitle(l10n.managementSection, isDark),
                    const SizedBox(height: 16),
                    _buildManagementCard(
                      label: l10n.vendorPanelLabel,
                      subtitle: l10n.vendorPanelSubtitle,
                      icon: HugeIcons.strokeRoundedStore01,
                      color: const Color(0xFF10B981),
                      cardBg: isDark ? kNeutral800 : const Color(0xFFF0FDF4),
                      borderCol: isDark ? kNeutral700 : const Color(0xFFDCFCE7),
                      isDark: isDark,
                      onTap: () => context.push('/vendor/dashboard'),
                    ),
                    if (isAdmin) ...[
                      const SizedBox(height: 12),
                      _buildManagementCard(
                        label: l10n.adminPanelLabel,
                        subtitle: l10n.adminPanelSubtitle,
                        icon: HugeIcons.strokeRoundedSecurityCheck,
                        color: const Color(0xFFF43F5E),
                        cardBg: isDark ? const Color(0x1AEE4444) : const Color(0xFFFFF1F2),
                        borderCol: isDark ? const Color(0x33EE4444) : const Color(0xFFFFE4E6),
                        isDark: isDark,
                        onTap: () => context.push('/admin/dashboard'),
                      ),
                    ],
                  ],

                  // ── Sign Out Button ────────────────────────────────────────
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton.icon(
                      onPressed: _signOut,
                      icon: const HugeIcon(icon: HugeIcons.strokeRoundedLogout01, color: Colors.white, size: 20),
                      label: Text(l10n.signOut, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kDanger,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: isDark ? Colors.white : kNeutral900,
        ),
      ),
    );
  }

  Widget _buildInfoCard({
    required String label,
    required String value,
    required dynamic icon,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? kNeutral800 : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isDark ? kNeutral700 : kNeutral50,
              borderRadius: BorderRadius.circular(16),
            ),
            alignment: Alignment.center,
            child: HugeIcon(
              icon: icon,
              color: kWaGreenDark,
              size: 20,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: kNeutral500,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : kNeutral900,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildLinkItem({
    required String label,
    required dynamic icon,
    required Color color,
    required Color bg,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.center,
        child: HugeIcon(
          icon: icon,
          color: color,
          size: 24,
        ),
      ),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: isDark ? Colors.white : kNeutral900,
        ),
      ),
      trailing: const DirectionalHugeIcon(
        icon: HugeIcons.strokeRoundedArrowRight01,
        color: Color(0xFFCCCCCC),
        size: 20,
      ),
      onTap: onTap,
    );
  }

  Widget _buildManagementCard({
    required String label,
    required String subtitle,
    required dynamic icon,
    required Color color,
    required Color cardBg,
    required Color borderCol,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: borderCol),
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isDark ? kNeutral700 : Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: HugeIcon(
                icon: icon,
                color: color,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: isDark ? Colors.white : kNeutral900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: kNeutral500,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            DirectionalHugeIcon(
              icon: HugeIcons.strokeRoundedArrowRight01,
              color: color,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }
}

class _Data {
  final Map<String, dynamic> user;
  final Map<String, dynamic>? profile;
  _Data({required this.user, this.profile});
}
