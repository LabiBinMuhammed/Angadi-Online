import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../theme/app_theme.dart';

class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  Future<void> _launchEmail() async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: 'support@angadionline.com',
      query: 'subject=Angadi%20Terms%20Inquiry',
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
          'Terms of Service',
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
                      ? [const Color(0xFF1E3A8A), const Color(0xFF0F172A)]
                      : [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isDark ? const Color(0xFF3B82F6).withOpacity(0.3) : const Color(0xFF3B82F6).withOpacity(0.2),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    alignment: Alignment.center,
                    child: const HugeIcon(
                      icon: HugeIcons.strokeRoundedFile01,
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
                          'Terms & User Guidelines',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : kNeutral900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Angadi Online Marketplace Agreement',
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
              title: '1. Agreement to Terms',
              content: 'By creating an account or accessing Angadi Online, you agree to these Terms of Service. If you do not agree, please do not use the application.',
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '2. Multi-Shop Marketplace Model',
              content: '• Angadi Online connects you with independent local neighborhood shops.\n• Each shop is responsible for its pricing, product stock, packing freshness, and doorstep delivery.\n• A direct transaction is established between you and the respective shop vendor upon placing an order.',
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '3. Pricing, Weights & Payment',
              content: '• Estimated Price: Weighted produce (e.g. vegetables, fruits, meat) displays an estimated cost in cart. The exact amount is finalized by the vendor upon physical weighing.\n• Payment Options: Cash on Delivery (COD), direct shop UPI, or verified Shop-Managed Credit.',
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '4. Delivery Shifts & Timings',
              content: '• Morning Shift: 7:00 AM – 12:00 PM (Same-day cut-off: 8:00 AM)\n• Evening Shift: 4:00 PM – 8:00 PM (Same-day cut-off: 2:00 PM)\n• Orders placed after slot cut-off are scheduled for the next available shift.',
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '5. Replacements & Cancellations',
              content: '• Free Cancellations: Allowed before the shop begins order packing/dispatch.\n• Replacement Claims: If an item is damaged or incorrect, submit a replacement request with a photo within 24 hours of delivery.\n• Vendor Options: The vendor may deliver in the next shift, dispatch immediately, or offer refund/credit.',
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            _buildSection(
              title: '6. User Conduct',
              content: 'You agree to provide true and accurate delivery details and phone numbers. Fraudulent orders or harassment of delivery agents will lead to immediate account termination.',
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
                    'For questions or legal inquiries regarding these terms:',
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? const Color(0xFFCBD5E1) : kNeutral700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: _launchEmail,
                    borderRadius: BorderRadius.circular(8),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Icon(Icons.email_outlined, color: Color(0xFF2563EB), size: 18),
                          SizedBox(width: 8),
                          Text(
                            'support@angadionline.com',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF2563EB),
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
}
