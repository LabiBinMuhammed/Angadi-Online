import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../theme/app_theme.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  Future<void> _launchEmail() async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: 'support@angadionline.com',
      query: 'subject=Angadi%20Privacy%20Inquiry',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? kNeutral900 : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Privacy Policy',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : kNeutral900,
          ),
        ),
        centerTitle: true,
        backgroundColor: isDark ? kNeutral900 : Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded, color: isDark ? Colors.white : kNeutral900, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark 
                      ? [const Color(0xFF064E3B), const Color(0xFF0F172A)]
                      : [const Color(0xFFECFDF5), const Color(0xFFF0FDF4)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? const Color(0xFF059669).withOpacity(0.3) : const Color(0xFF10B981).withOpacity(0.2),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: kWaGreen,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: const HugeIcon(
                      icon: HugeIcons.strokeRoundedSecurityCheck,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Angadi Online',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : kNeutral900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Effective: August 16, 2026',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            _buildSection(
              title: '1. Introduction',
              content: 'Angadi Online ("we", "our", or "the Platform") respects your privacy. This policy describes how we collect, use, and protect your personal information when you use our mobile application and services.',
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '2. Information We Collect',
              isDark: isDark,
              customBody: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSubItem('• Account Info:', 'Full name, phone number (used for authentication & delivery), and optional email address.', isDark),
                  const SizedBox(height: 8),
                  _buildSubItem('• Location & Address:', 'Saved delivery addresses, landmarks, and GPS coordinates to find local neighborhood shops and complete doorstep deliveries.', isDark),
                  const SizedBox(height: 8),
                  _buildSubItem('• Order Details:', 'Cart items, delivery slots (Morning/Evening), and payment method preferences.', isDark),
                  const SizedBox(height: 8),
                  _buildSubItem('• Photos (Optional):', 'Product images uploaded voluntarily for damage complaints or replacement requests.', isDark),
                ],
              ),
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '3. How We Use Information',
              content: '• Fulfilling and delivering orders from your chosen local shops.\n• Account verification via secure phone authentication.\n• Sending essential order status updates.\n• Processing returns, refunds, and replacement requests.',
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '4. Third-Party Sharing',
              content: 'We do NOT sell, trade, or rent your personal information to advertising brokers. Data is only shared with:\n• The specific local shop vendor fulfilling your order (name, phone, delivery address).\n• Secure Supabase cloud infrastructure with Row Level Security (RLS) protection.',
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '5. Account & Data Deletion',
              isDark: isDark,
              customBody: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'You have the right to request deletion of your account and personal data at any time.',
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.5,
                      color: isDark ? const Color(0xFFCBD5E1) : kNeutral700,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0x20EF4444) : const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'How to delete:',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFFDC2626)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '1. In App: Profile → Security Settings → Delete Account, OR\n2. Email: support@angadionline.com with your registered phone number.',
                          style: TextStyle(
                            fontSize: 12,
                            height: 1.5,
                            fontWeight: FontWeight.w600,
                            color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFF991B1B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '6. Security & Encryption',
              content: 'Your credentials and communications are encrypted using HTTPS/TLS and authenticated with secure JWT tokens. Database tables are protected by Row Level Security (RLS) to prevent unauthorized access.',
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '7. Contact Us',
              isDark: isDark,
              customBody: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'For questions or privacy concerns, contact our support team:',
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? const Color(0xFFCBD5E1) : kNeutral700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: _launchEmail,
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Icon(Icons.email_outlined, color: kWaGreen, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            'support@angadionline.com',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: kWaGreen,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    String? content,
    Widget? customBody,
    required bool isDark,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? kNeutral800 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? kNeutral700 : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : kNeutral900,
            ),
          ),
          const SizedBox(height: 10),
          if (content != null)
            Text(
              content,
              style: TextStyle(
                fontSize: 13.5,
                height: 1.6,
                color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
              ),
            ),
          if (customBody != null) customBody,
        ],
      ),
    );
  }

  Widget _buildSubItem(String title, String desc, bool isDark) {
    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: 13.5,
          height: 1.5,
          color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF475569),
        ),
        children: [
          TextSpan(
            text: '$title ',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white : kNeutral900,
            ),
          ),
          TextSpan(text: desc),
        ],
      ),
    );
  }
}
