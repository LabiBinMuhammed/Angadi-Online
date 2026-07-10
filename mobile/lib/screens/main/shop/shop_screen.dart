import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../core/language_service.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class ShopScreen extends StatefulWidget {
  final String shopId;
  final String? initialTab;
  const ShopScreen({super.key, required this.shopId, this.initialTab});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  late Future<_ShopData> _dataFuture;

  @override
  void initState() {
    super.initState();
    _dataFuture = _fetch();
  }

  Future<_ShopData> _fetch() async {
    final results = await Future.wait([
      supabase.from('shops').select('id, name, type').eq('id', widget.shopId).single(),
      supabase
          .from('items')
          .select('id, shop_id, name, description, category_id, has_variants, is_active, item_images(*), item_translations(*)')
          .eq('shop_id', widget.shopId)
          .eq('is_active', true)
          .isFilter('deleted_at', null)
          .order('name'),
      supabase.from('categories').select('id, name, category_translations(*)').eq('is_active', true).order('name'),
      supabase.from('shop_rating_summary').select('*').eq('shop_id', widget.shopId).maybeSingle(),
    ]);

    final summaryMap = results[3] as Map<String, dynamic>?;
    final ratingSummary = summaryMap != null
        ? ShopRatingSummary.fromJson(summaryMap)
        : ShopRatingSummary(
            shopId: widget.shopId,
            averageRating: 0.0,
            totalReviews: 0,
            stars: 0,
            avgProductQuality: 0.0,
            avgDeliveryTimeliness: 0.0,
            avgOrderAccuracy: 0.0,
            avgOverallExperience: 0.0,
            commissionComplianceStars: 0,
            orderPerformanceStars: 0,
            salesPerformanceStars: 0,
            updatedAt: DateTime.now(),
          );

    final cats = (results[2] as List).map((j) => Category.fromJson(j)).toList();
    final activeCategoryIds = cats.map((c) => c.id).toSet();
    final itemsList = (results[1] as List).map((j) => Item.fromJson(j)).toList();
    final filteredItems = itemsList.where((item) =>
      item.categoryId == null || activeCategoryIds.contains(item.categoryId)
    ).toList();

    return _ShopData(
      shop:       Shop.fromJson(results[0] as Map<String, dynamic>),
      items:      filteredItems,
      categories: cats,
      summary:    ratingSummary,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;

    return FutureBuilder<_ShopData>(
      future: _dataFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final d = snapshot.data!;
        final activeCategoryIds = d.items.map((item) => item.categoryId).toSet();
        final filteredCategories = d.categories.where((cat) => activeCategoryIds.contains(cat.id)).toList();

        final ratingText = d.summary.totalReviews > 0
            ? ' ⭐ ${d.summary.averageRating.toStringAsFixed(1)}'
            : '';

        return DefaultTabController(
          length: 2,
          initialIndex: widget.initialTab == 'reviews' ? 1 : 0,
          child: Scaffold(
            backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
            appBar: AppBar(
              backgroundColor: kWaTeal,
              foregroundColor: Colors.white,
              title: Text('${d.shop.name}$ratingText'),
              actions: [
                Builder(
                  builder: (context) {
                    return IconButton(
                      icon: const Icon(Icons.rate_review_rounded),
                      tooltip: 'View Reviews',
                      onPressed: () {
                        DefaultTabController.of(context).animateTo(1);
                      },
                    );
                  },
                ),
              ],
              bottom: TabBar(
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white.withValues(alpha: 0.6),
                indicatorColor: kWaGreen,
                tabs: [
                  Tab(text: l10n.catalogTab),
                  Tab(text: l10n.reviewsTab),
                ],
              ),
            ),
            body: TabBarView(
              children: [
                // ── Tab 1: Catalog ────────────────────────────────────────
                Column(
                  children: [
                    // Category pills
                    if (filteredCategories.isNotEmpty)
                      SizedBox(
                        height: 48,
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          scrollDirection: Axis.horizontal,
                          itemCount: filteredCategories.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, i) {
                            final cat = filteredCategories[i];
                            return OutlinedButton(
                              onPressed: () =>
                                  context.push('/home/shop/${widget.shopId}/category/${cat.id}'),
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(color: isDark ? kNeutral700 : kNeutral300),
                                backgroundColor: isDark ? kNeutral800 : Colors.white,
                                foregroundColor: isDark ? Colors.white : kNeutral800,
                              ),
                              child: Text(cat.getLocalizedName(LanguageService.instance.locale.languageCode)),
                            );
                          },
                        ),
                      ),

                    // Items
                    Expanded(
                      child: d.items.isEmpty
                          ? Center(child: Text(l10n.noItemsInShop))
                          : GridView.builder(
                              padding: const EdgeInsets.all(16),
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                                childAspectRatio: .85,
                              ),
                              itemCount: d.items.length,
                              itemBuilder: (_, i) => _ItemCard(item: d.items[i]),
                            ),
                    ),
                  ],
                ),

                // ── Tab 2: Reviews ────────────────────────────────────────
                ShopReviewsWidget(shopId: widget.shopId, summary: d.summary),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ItemCard extends StatelessWidget {
  final Item item;
  const _ItemCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return GestureDetector(
      onTap: () => context.push('/home/item/${item.id}'),
      child: Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: Center(
                  child: item.imageUrl != null
                      ? Image.network(item.imageUrl!, fit: BoxFit.cover)
                      : const Text('📦', style: TextStyle(fontSize: 36)),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Text(item.getLocalizedName(LanguageService.instance.locale.languageCode),
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  maxLines: 2, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
      ),
    );
  }
}

class _ShopData {
  final Shop shop;
  final List<Item> items;
  final List<Category> categories;
  final ShopRatingSummary summary;
  _ShopData({required this.shop, required this.items, required this.categories, required this.summary});
}

// ── Shop Reviews List and Breakdown Widget ────────────────────────────────────

class ShopReviewsWidget extends StatefulWidget {
  final String shopId;
  final ShopRatingSummary summary;
  const ShopReviewsWidget({super.key, required this.shopId, required this.summary});

  @override
  State<ShopReviewsWidget> createState() => _ShopReviewsWidgetState();
}

class _ShopReviewsWidgetState extends State<ShopReviewsWidget> {
  List<ShopReview> _reviews = [];
  bool _loading = true;

  double _avgQuality = 0.0;
  double _avgDelivery = 0.0;
  double _avgAccuracy = 0.0;
  double _avgOverall = 0.0;

  String? _unreviewedOrderId;
  bool _checkedOrder = false;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _loadReviews();
  }

  Future<void> _loadReviews() async {
    try {
      final response = await supabase
          .from('shop_reviews')
          .select('*, users(name)')
          .eq('shop_id', widget.shopId)
          .order('created_at', ascending: false);

      final list = (response as List).map((j) => ShopReview.fromJson(j)).toList();

      // Recalculate parameters average
      double qSum = 0;
      double dSum = 0;
      double aSum = 0;
      double oSum = 0;
      for (final r in list) {
        qSum += r.productQualityRating;
        dSum += r.deliveryTimelinessRating ?? r.deliveryExperienceRating;
        aSum += r.orderAccuracyRating;
        oSum += r.overallExperienceRating;
      }

      // Check unreviewed order
      String? unreviewedId;
      bool isAuthed = false;
      final currentUser = supabase.auth.currentUser;
      if (currentUser != null) {
        isAuthed = true;
        final ordersRes = await supabase
            .from('orders')
            .select('id, shop_reviews(id)')
            .eq('shop_id', widget.shopId)
            .eq('user_id', currentUser.id)
            .eq('status', 'delivered')
            .order('created_at', ascending: false);

        if (ordersRes is List) {
          for (final o in ordersRes) {
            final reviewsList = o['shop_reviews'] as List?;
            if (reviewsList == null || reviewsList.isEmpty) {
              unreviewedId = o['id'] as String;
              break;
            }
          }
        }
      }

      if (mounted) {
        setState(() {
          _reviews = list;
          _isAuthenticated = isAuthed;
          _unreviewedOrderId = unreviewedId;
          _checkedOrder = true;
          if (list.isNotEmpty) {
            _avgQuality = qSum / list.length;
            _avgDelivery = dSum / list.length;
            _avgAccuracy = aSum / list.length;
            _avgOverall = oSum / list.length;
          }
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.failedToLoadReviews(e.toString()))),
        );
      }
    }
  }

  Widget _buildStarBadge(int stars) {
    if (stars == 1) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFFCD7F32).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFCD7F32).withValues(alpha: 0.3)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.star_rounded, color: Color(0xFFCD7F32), size: 16),
            SizedBox(width: 6),
            Text(
              'Bronze Star Merchant',
              style: TextStyle(color: Color(0xFFCD7F32), fontSize: 12, fontWeight: FontWeight.w800),
            ),
          ],
        ),
      );
    } else if (stars == 2) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFFC0C0C0).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFC0C0C0).withValues(alpha: 0.3)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.stars_rounded, color: Color(0xFFC0C0C0), size: 16),
            SizedBox(width: 6),
            Text(
              'Silver Star Merchant',
              style: TextStyle(color: Color(0xFFC0C0C0), fontSize: 12, fontWeight: FontWeight.w800),
            ),
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }

  Widget _buildParameterRow(String label, double val) {
    final isDark = ThemeService.instance.isDarkMode;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(
            flex: 5,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isDark ? kNeutral400 : kNeutral600,
              ),
            ),
          ),
          Expanded(
            flex: 4,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: val / 5.0,
                backgroundColor: isDark ? kNeutral700 : kNeutral200,
                valueColor: AlwaysStoppedAnimation<Color>(kWaGreenDark),
                minHeight: 6,
              ),
            ),
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 28,
            child: Text(
              '${val.toStringAsFixed(1)} ★',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : kNeutral900,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  void _handleWriteReviewClick() async {
    if (!_isAuthenticated) {
      context.push('/login');
    } else if (_unreviewedOrderId != null) {
      final result = await context.push<bool>('/orders/$_unreviewedOrderId/review');
      if (result == true) {
        setState(() => _loading = true);
        _loadReviews();
      }
    } else {
      context.push('/orders');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;
    final kCardBg = isDark ? kNeutral800 : Colors.white;
    final kBorder = isDark ? kNeutral700 : kNeutral200;

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final double avgQ = widget.summary.avgProductQuality > 0 ? widget.summary.avgProductQuality : _avgQuality;
    final double avgD = widget.summary.avgDeliveryTimeliness > 0 ? widget.summary.avgDeliveryTimeliness : _avgDelivery;
    final double avgA = widget.summary.avgOrderAccuracy > 0 ? widget.summary.avgOrderAccuracy : _avgAccuracy;
    final double avgO = widget.summary.avgOverallExperience > 0 ? widget.summary.avgOverallExperience : _avgOverall;

    final counts = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    for (final r in _reviews) {
      final overall = r.overallExperienceRating.clamp(1, 5);
      counts[overall] = (counts[overall] ?? 0) + 1;
    }
    final total = _reviews.isEmpty ? 1 : _reviews.length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _reviews.isEmpty
              ? Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
                  decoration: BoxDecoration(
                    color: kCardBg,
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(color: kBorder),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // SVG illustration using CustomPaint or elegant container representation
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isDark ? kNeutral900 : kNeutral100,
                        ),
                        child: Icon(
                          Icons.chat_bubble_outline_rounded,
                          size: 44,
                          color: isDark ? kNeutral500 : kNeutral400,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        l10n.noReviewsYet,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : kNeutral900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        l10n.noReviewsSubtitle,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? kNeutral400 : kNeutral500,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (_checkedOrder) ...[
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: _handleWriteReviewClick,
                          icon: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                          label: Text(
                            l10n.writeFirstReviewButton,
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kWaGreenDark,
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                      ]
                    ],
                  ),
                )
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── 1. Star Rating Banner ──
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: kCardBg,
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(color: kBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                widget.summary.averageRating.toStringAsFixed(1),
                                style: TextStyle(
                                  fontSize: 54,
                                  fontWeight: FontWeight.w900,
                                  color: isDark ? Colors.white : kNeutral900,
                                  letterSpacing: -1,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: List.generate(5, (index) {
                                      final isStarred = index < widget.summary.averageRating.round();
                                      return Icon(
                                        isStarred ? Icons.star_rounded : Icons.star_outline_rounded,
                                        color: const Color(0xFFF59E0B),
                                        size: 26,
                                      );
                                    }),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${widget.summary.totalReviews} Reviews',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: kNeutral500,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          _buildStarBadge(widget.summary.stars),
                          const SizedBox(height: 20),
                          const Divider(),
                          const SizedBox(height: 12),
                          _buildParameterRow('Product Quality', avgQ),
                          _buildParameterRow('Delivery Timeliness', avgD),
                          _buildParameterRow('Order Accuracy', avgA),
                          _buildParameterRow('Overall Experience', avgO),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── 2. Rating Distribution Card ──
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: kCardBg,
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(color: kBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Rating Breakdown',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : kNeutral900,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ...[5, 4, 3, 2, 1].map((s) {
                            final count = counts[s] ?? 0;
                            final double percent = count / total;
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 12,
                                    child: Text(
                                      '$s',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? kNeutral400 : kNeutral600,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Icon(Icons.star_rounded, color: isDark ? kNeutral500 : kNeutral400, size: 12),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: percent,
                                        backgroundColor: isDark ? kNeutral700 : kNeutral200,
                                        valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF59E0B)),
                                        minHeight: 6,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  SizedBox(
                                    width: 24,
                                    child: Text(
                                      '$count',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w700,
                                        color: isDark ? Colors.white : kNeutral900,
                                      ),
                                      textAlign: TextAlign.end,
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),

                    // ── 3. Reviews Header ──
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Customer Reviews',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: isDark ? Colors.white : kNeutral900,
                          ),
                        ),
                        if (_checkedOrder)
                          TextButton.icon(
                            onPressed: _handleWriteReviewClick,
                            icon: Icon(
                              _unreviewedOrderId != null ? Icons.rate_review_rounded : Icons.shopping_bag_outlined,
                              size: 16,
                              color: kWaGreenDark,
                            ),
                            label: Text(
                              _unreviewedOrderId != null ? l10n.leaveShopReviewButton : l10n.myOrdersTitle,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: kWaGreenDark,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // ── 4. Reviews List ──
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _reviews.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        final rev = _reviews[index];
                        final dateStr = '${rev.createdAt.day}/${rev.createdAt.month}/${rev.createdAt.year}';
                        final name = rev.reviewerName ?? l10n.anonymousReviewer;

                        return Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: kCardBg,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: kBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          name,
                                          style: TextStyle(
                                            fontWeight: FontWeight.w800,
                                            fontSize: 14,
                                            color: isDark ? Colors.white : kNeutral900,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: kWaGreenDark.withValues(alpha: 0.08),
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(Icons.check_circle_rounded, color: kWaGreenDark, size: 10),
                                              const SizedBox(width: 4),
                                              Text(
                                                l10n.verifiedPurchaseBadge,
                                                style: TextStyle(
                                                  fontSize: 9,
                                                  fontWeight: FontWeight.w800,
                                                  color: kWaGreenDark,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Text(
                                    dateStr,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: kNeutral500,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Row(
                                    children: List.generate(5, (i) {
                                      return Icon(
                                        i < rev.overallExperienceRating
                                            ? Icons.star_rounded
                                            : Icons.star_outline_rounded,
                                        color: const Color(0xFFF59E0B),
                                        size: 16,
                                      );
                                    }),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              // 4 Rating Categories with Stars and Descriptions
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: kBorder),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _buildRatingItem('Product Quality', rev.productQualityRating, rev.productQualityReview ?? rev.productQualityDescription),
                                    const SizedBox(height: 8),
                                    _buildRatingItem('Delivery Timeliness', rev.deliveryTimelinessRating ?? rev.deliveryExperienceRating, rev.deliveryTimelinessReview ?? rev.deliveryExperienceDescription),
                                    const SizedBox(height: 8),
                                    _buildRatingItem('Order Accuracy', rev.orderAccuracyRating, rev.orderAccuracyReview ?? rev.orderAccuracyDescription),
                                    const SizedBox(height: 8),
                                    _buildRatingItem('Overall Experience', rev.overallExperienceRating, rev.overallExperienceReview ?? rev.overallExperienceDescription),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
        ],
      ),
    );
  }

  Widget _buildRatingItem(String label, int rating, String? description) {
    final isDark = ThemeService.instance.isDarkMode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: isDark ? Colors.white : kNeutral800),
            ),
            Row(
              children: List.generate(5, (i) {
                return Icon(
                  i < rating ? Icons.star_rounded : Icons.star_outline_rounded,
                  color: const Color(0xFFF59E0B),
                  size: 14,
                );
              }),
            ),
          ],
        ),
        if (description != null && description.trim().isNotEmpty) ...[
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              '"$description"',
              style: TextStyle(
                fontSize: 12,
                fontStyle: FontStyle.italic,
                color: isDark ? kNeutral400 : kNeutral600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ],
    );
  }
}
