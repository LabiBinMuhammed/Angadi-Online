import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../core/location_service.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class SelectLocationScreen extends StatefulWidget {
  const SelectLocationScreen({super.key});

  @override
  State<SelectLocationScreen> createState() => _SelectLocationScreenState();
}

class _SelectLocationScreenState extends State<SelectLocationScreen> {
  List<Map<String, dynamic>> _locations = [];
  bool _loading = true;
  String _searchQuery = '';

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
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load locations: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final scaffoldBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA);
    final cardBg = isDark ? kNeutral800 : Colors.white;
    final cardBorder = isDark ? kNeutral700 : kNeutral200;
    final textMain = isDark ? Colors.white : kNeutral900;
    final textMuted = isDark ? kNeutral400 : kNeutral500;

    final selectedId = LocationService.instance.selectedLocationId;

    final filtered = _locations.where((loc) {
      final name = (loc['name'] as String? ?? '').toLowerCase();
      return name.contains(_searchQuery.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Select Location'),
        leading: IconButton(
          icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Search Input
          Container(
            color: isDark ? kNeutral900 : Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Container(
              height: 46,
              decoration: BoxDecoration(
                color: isDark ? kNeutral800 : kNeutral100,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: cardBorder),
              ),
              child: TextField(
                onChanged: (v) => setState(() => _searchQuery = v),
                style: TextStyle(fontSize: 14, color: textMain),
                decoration: InputDecoration(
                  hintText: 'Search locations…',
                  hintStyle: TextStyle(color: textMuted, fontSize: 14),
                  prefixIcon: Icon(Icons.search, size: 20, color: textMuted),
                  border: InputBorder.none,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(vertical: 13),
                ),
              ),
            ),
          ),
          Divider(height: 1, color: cardBorder),

          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // "All Locations" Option
                      if (_searchQuery.isEmpty) ...[
                        _buildLocationTile(
                          id: null,
                          name: 'All Locations',
                          type: 'global',
                          isSelected: selectedId == null,
                          isDark: isDark,
                          cardBg: cardBg,
                          cardBorder: cardBorder,
                          textMain: textMain,
                          textMuted: textMuted,
                        ),
                        const SizedBox(height: 12),
                      ],

                      // Location List
                      ...filtered.map((loc) {
                        final id = loc['id'] as String;
                        final name = loc['name'] as String? ?? '—';
                        final type = loc['type'] as String? ?? 'general';
                        final isSelected = selectedId == id;

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _buildLocationTile(
                            id: id,
                            name: name,
                            type: type,
                            isSelected: isSelected,
                            isDark: isDark,
                            cardBg: cardBg,
                            cardBorder: cardBorder,
                            textMain: textMain,
                            textMuted: textMuted,
                          ),
                        );
                      }),

                      if (filtered.isEmpty && _locations.isNotEmpty)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Text(
                              'No locations match your search.',
                              style: TextStyle(color: textMuted),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
        ],
      ),
    );
  }

  Widget _buildLocationTile({
    required String? id,
    required String name,
    required String type,
    required bool isSelected,
    required bool isDark,
    required Color cardBg,
    required Color cardBorder,
    required Color textMain,
    required Color textMuted,
  }) {
    return InkWell(
      onTap: () async {
        await LocationService.instance.setLocation(id, id == null ? null : name);
        if (mounted) {
          context.pop();
        }
      },
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: isSelected ? (isDark ? const Color(0xFF1E3A24) : const Color(0xFFE8F5E9)) : cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? (isDark ? const Color(0xFF2E7D32) : const Color(0xFF81C784))
                : cardBorder,
            width: isSelected ? 2 : 1,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected
                    ? (isDark ? const Color(0xFF2E7D32) : const Color(0xFFC8E6C9))
                    : (isDark ? kNeutral700 : kNeutral100),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: HugeIcon(
                icon: HugeIcons.strokeRoundedLocation01,
                color: isSelected
                    ? (isDark ? Colors.white : const Color(0xFF2E7D32))
                    : (isDark ? kNeutral300 : kWaTeal),
                size: 20,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: isSelected
                          ? (isDark ? Colors.white : const Color(0xFF2E7D32))
                          : textMain,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    type.toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? (isDark ? const Color(0xFFA5D6A7) : const Color(0xFF388E3C))
                          : textMuted,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: isDark ? const Color(0xFF81C784) : const Color(0xFF2E7D32),
                size: 22,
              ),
          ],
        ),
      ),
    );
  }
}
