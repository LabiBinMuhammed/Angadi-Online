import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class PinnedShopsScreen extends StatefulWidget {
  const PinnedShopsScreen({super.key});

  @override
  State<PinnedShopsScreen> createState() => _PinnedShopsScreenState();
}

class _PinnedShopsScreenState extends State<PinnedShopsScreen> {
  bool _isLoading = true;
  List<dynamic> _pinnedShops = [];

  @override
  void initState() {
    super.initState();
    _fetchPinnedShops();
  }

  Future<void> _fetchPinnedShops() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final response = await supabase
          .from('customer_pinned_shops')
          .select('id, shop:shops(id, name, type)')
          .eq('user_id', userId);

      setState(() {
        _pinnedShops = response as List<dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching pinned shops: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _unpinShop(String shopId, String shopName) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return;

    // Optimistic UI update
    final previousList = List.from(_pinnedShops);
    setState(() {
      _pinnedShops.removeWhere((item) => item['shop']['id'] == shopId);
    });

    try {
      await supabase
          .from('customer_pinned_shops')
          .delete()
          .eq('user_id', userId)
          .eq('shop_id', shopId);

      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.unpinnedSuccessfully(shopName))),
        );
      }
    } catch (e) {
      debugPrint('Error unpinning shop: $e');
      setState(() {
        _pinnedShops = previousList;
      });
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.failedToUpdatePinStatus)),
        );
      }
    }
  }

  String _getInitials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : name.length).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: isDark ? Colors.white : kNeutral900, size: 20),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/profile');
            }
          },
        ),
        title: Text(
          l10n.pinnedShopsTitle,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : kNeutral900,
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: kWaGreenDark))
          : _pinnedShops.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      HugeIcon(icon: HugeIcons.strokeRoundedBookmark01, size: 64, color: isDark ? kNeutral600 : kNeutral400),
                      const SizedBox(height: 16),
                      Text(
                        l10n.noPinnedShopsYet,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : kNeutral900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        l10n.noPinnedShopsSubtitle,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? kNeutral400 : kNeutral600,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _pinnedShops.length,
                  itemBuilder: (context, index) {
                    final item = _pinnedShops[index];
                    final shop = item['shop'];
                    final shopId = shop['id'] as String;
                    final shopName = shop['name'] as String;
                    final shopType = shop['type'] as String? ?? 'Shop';
                    final logoUrl = shop['logo_url'] as String?;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: isDark ? kNeutral800 : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        onTap: () => context.push('/home/shop/$shopId'),
                        leading: Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: isDark ? kNeutral700 : kNeutral200,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: logoUrl != null && logoUrl.isNotEmpty
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: Image.network(logoUrl, fit: BoxFit.cover),
                                )
                              : Center(
                                  child: Text(
                                    _getInitials(shopName),
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: isDark ? Colors.white70 : kNeutral700,
                                    ),
                                  ),
                                ),
                        ),
                        title: Text(
                          shopName,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: isDark ? Colors.white : kNeutral900,
                          ),
                        ),
                        subtitle: Text(
                          shopType.toUpperCase(),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? kNeutral400 : kNeutral600,
                          ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: HugeIcon(icon: HugeIcons.strokeRoundedDelete02, color: kDanger, size: 20),
                              onPressed: () => _unpinShop(shopId, shopName),
                            ),
                            Icon(Icons.chevron_right, color: isDark ? kNeutral500 : kNeutral400),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
