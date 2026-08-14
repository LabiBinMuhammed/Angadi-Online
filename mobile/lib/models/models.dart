// ─── Enums ────────────────────────────────────────────────────────────────────

enum UserRole { customer, shopOwner, admin }

enum SellMode { manual, packed, dynamic, portion }

enum VariantType { manual, packed, dynamic, portion }

enum OrderStatus { pending, packing, delivering, delivered, cancelled }

enum OrderItemStatus { pending, adjusted, approved, rejected }

enum PaymentType { cod, credit }

// ─── Models ───────────────────────────────────────────────────────────────────

class AppUser {
  final String id;
  final String name;
  final String phone;
  final UserRole role;
  final bool isActive;

  const AppUser({
    required this.id,
    required this.name,
    required this.phone,
    required this.role,
    required this.isActive,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
        id: json['id'] as String,
        name: json['name'] as String,
        phone: json['phone'] as String,
        role: UserRole.values.byName(
          (json['role'] as String).replaceAll('_', '').toLowerCase() == 'shopowner'
              ? 'shopOwner'
              : (json['role'] as String).toLowerCase(),
        ),
        isActive: json['is_active'] as bool? ?? true,
      );
}

class Shop {
  final String id;
  final String name;
  final String? type;
  final String? locationId;
  final String? logoUrl;

  const Shop({
    required this.id,
    required this.name,
    this.type,
    this.locationId,
    this.logoUrl,
  });

  factory Shop.fromJson(Map<String, dynamic> json) => Shop(
        id: json['id'] as String,
        name: json['name'] as String,
        type: json['type'] as String?,
        locationId: json['location_id'] as String?,
        logoUrl: json['logo_url'] as String?,
      );
}

class Category {
  final String id;
  final String name;
  final bool isActive;
  final double commissionPercentage;
  final List<Map<String, dynamic>>? categoryTranslations;

  const Category({
    required this.id,
    required this.name,
    this.isActive = true,
    this.commissionPercentage = 4.0,
    this.categoryTranslations,
  });

  factory Category.fromJson(Map<String, dynamic> json) => Category(
        id: json['id'] as String,
        name: json['name'] as String,
        isActive: json['is_active'] as bool? ?? true,
        commissionPercentage: (json['commission_percentage'] as num?)?.toDouble() ?? 4.0,
        categoryTranslations: (json['category_translations'] as List?)
            ?.map((e) => Map<String, dynamic>.from(e as Map))
            .toList(),
      );

  String getLocalizedName(String languageCode) {
    if (languageCode == 'en') return name;
    if (categoryTranslations == null) return name;
    final trans = categoryTranslations!.firstWhere(
      (t) => t['language_code'] == languageCode,
      orElse: () => <String, dynamic>{},
    );
    if (trans.isNotEmpty && trans['name'] != null && trans['name'].toString().isNotEmpty) {
      return trans['name'] as String;
    }
    return name;
  }
}

class Unit {
  final String id;
  final String name;
  final String symbol;
  final String unitGroupId;
  final double baseMultiplier;

  const Unit({
    required this.id,
    required this.name,
    required this.symbol,
    required this.unitGroupId,
    required this.baseMultiplier,
  });

  factory Unit.fromJson(Map<String, dynamic> json) => Unit(
        id: json['id'] as String? ?? '',
        name: json['name'] as String? ?? '',
        symbol: json['symbol'] as String? ?? '',
        unitGroupId: json['unit_group_id'] as String? ?? '',
        baseMultiplier: (json['base_multiplier'] as num?)?.toDouble() ?? 1.0,
      );
}

class ItemSellConfig {
  final String id;
  final String itemId;
  final SellMode sellMode;
  final String? baseUnitId;
  final double? pricePerBaseUnit;
  final double? maxPriceIncreasePercent;
  final double? maxPriceLimit;
  final bool allowCustomQuantity;

  const ItemSellConfig({
    required this.id,
    required this.itemId,
    required this.sellMode,
    this.baseUnitId,
    this.pricePerBaseUnit,
    this.maxPriceIncreasePercent,
    this.maxPriceLimit,
    required this.allowCustomQuantity,
  });

  factory ItemSellConfig.fromJson(Map<String, dynamic> json) {
    final modeStr = json['sell_mode'] as String? ?? 'Fixed';
    SellMode mode;
    switch (modeStr.toLowerCase()) {
      case 'manual':
        mode = SellMode.manual;
        break;
      case 'packed':
      case 'fixed':
        mode = SellMode.packed;
        break;
      case 'dynamic':
        mode = SellMode.dynamic;
        break;
      case 'portion':
        mode = SellMode.portion;
        break;
      default:
        mode = SellMode.packed;
    }
    return ItemSellConfig(
      id: json['id'] as String? ?? '',
      itemId: json['item_id'] as String? ?? '',
      sellMode: mode,
      baseUnitId: json['base_unit_id'] as String?,
      pricePerBaseUnit: (json['price_per_base_unit'] as num?)?.toDouble(),
      maxPriceIncreasePercent: (json['max_price_increase_percent'] as num?)?.toDouble(),
      maxPriceLimit: (json['max_price_limit'] as num?)?.toDouble(),
      allowCustomQuantity: json['allow_custom_quantity'] as bool? ?? true,
    );
  }
}

class Item {
  final String id;
  final String shopId;
  final String name;
  final String? description;
  final String? imageUrl;
  final String? categoryId;
  final bool hasVariants;
  final bool isActive;
  final List<ItemSellConfig> itemSellConfig;
  final List<ItemVariant> itemVariants;
  final List<Map<String, dynamic>>? itemTranslations;

  const Item({
    required this.id,
    required this.shopId,
    required this.name,
    this.description,
    this.imageUrl,
    this.categoryId,
    required this.hasVariants,
    required this.isActive,
    this.itemSellConfig = const [],
    this.itemVariants = const [],
    this.itemTranslations,
  });

  factory Item.fromJson(Map<String, dynamic> json) {
    List<ItemSellConfig> configs = [];
    final rawConfig = json['item_sell_config'];
    if (rawConfig != null) {
      if (rawConfig is List) {
        configs = rawConfig.map((e) => ItemSellConfig.fromJson(e as Map<String, dynamic>)).toList();
      } else if (rawConfig is Map) {
        configs = [ItemSellConfig.fromJson(Map<String, dynamic>.from(rawConfig))];
      }
    }

    String? imageUrl = json['image_url'] as String?;
    final rawImages = json['item_images'];
    if (rawImages is List && rawImages.isNotEmpty) {
      final List<Map<String, dynamic>> imagesList = rawImages
          .map((e) => Map<String, dynamic>.from(e as Map))
          .toList();
      
      // Find the primary image, or default to the one with the lowest sort_order
      final primaryImg = imagesList.firstWhere(
        (img) => img['is_primary'] == true,
        orElse: () {
          imagesList.sort((a, b) => (a['sort_order'] as num? ?? 0)
              .compareTo(b['sort_order'] as num? ?? 0));
          return imagesList.first;
        },
      );
      imageUrl = primaryImg['image_url'] as String?;
    }

    return Item(
      id: json['id'] as String,
      shopId: json['shop_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      imageUrl: imageUrl,
      categoryId: json['category_id'] as String?,
      hasVariants: json['has_variants'] as bool? ?? false,
      isActive: json['is_active'] as bool? ?? true,
      itemSellConfig: configs,
      itemVariants: (json['item_variants'] as List?)
              ?.map((e) => ItemVariant.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      itemTranslations: (json['item_translations'] as List?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList(),
    );
  }

  String getLocalizedName(String languageCode) {
    if (languageCode == 'en') return name;
    if (itemTranslations == null) return name;
    final trans = itemTranslations!.firstWhere(
      (t) => t['language_code'] == languageCode,
      orElse: () => <String, dynamic>{},
    );
    if (trans.isNotEmpty && trans['name'] != null && trans['name'].toString().isNotEmpty) {
      return trans['name'] as String;
    }
    return name;
  }

  String? getLocalizedDescription(String languageCode) {
    String? desc;
    if (languageCode == 'en') {
      desc = description;
    } else if (itemTranslations == null) {
      desc = description;
    } else {
      final trans = itemTranslations!.firstWhere(
        (t) => t['language_code'] == languageCode,
        orElse: () => <String, dynamic>{},
      );
      if (trans.isNotEmpty && trans['description'] != null && trans['description'].toString().isNotEmpty) {
        desc = trans['description'] as String;
      } else {
        desc = description;
      }
    }
    if (desc != null && desc.contains('Keywords:')) {
      desc = desc.split(RegExp(r'\n*Keywords:', caseSensitive: false))[0].trim();
    }
    return desc;
  }
}

class ItemVariant {
  final String id;
  final String itemId;
  final VariantType variantType;
  final String label;
  final double? price;
  final double? value;
  final bool isDefault;
  final bool isActive;
  final String? imageUrl;
  final List<Map<String, dynamic>>? variantTranslations;

  const ItemVariant({
    required this.id,
    required this.itemId,
    required this.variantType,
    required this.label,
    this.price,
    this.value,
    required this.isDefault,
    required this.isActive,
    this.imageUrl,
    this.variantTranslations,
  });

  factory ItemVariant.fromJson(Map<String, dynamic> json) {
    final typeStr = json['variant_type'] as String? ?? 'manual';
    VariantType type;
    switch (typeStr.toLowerCase()) {
      case 'manual':
        type = VariantType.manual;
        break;
      case 'packed':
      case 'fixed':
        type = VariantType.packed;
        break;
      case 'dynamic':
        type = VariantType.dynamic;
        break;
      case 'portion':
        type = VariantType.portion;
        break;
      default:
        type = VariantType.manual;
    }
    return ItemVariant(
      id: json['id'] as String,
      itemId: json['item_id'] as String,
      variantType: type,
      label: json['label'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble(),
      value: (json['value'] as num?)?.toDouble(),
      isDefault: json['is_default'] as bool? ?? false,
      isActive: json['is_active'] as bool? ?? true,
      imageUrl: json['image_url'] as String?,
      variantTranslations: (json['variant_translations'] as List?)
              ?.map((e) => Map<String, dynamic>.from(e as Map))
              .toList(),
    );
  }

  String getLocalizedLabel(String languageCode) {
    if (languageCode == 'en') return label;
    if (variantTranslations == null) return label;
    final trans = variantTranslations!.firstWhere(
      (t) => t['language_code'] == languageCode,
      orElse: () => <String, dynamic>{},
    );
    if (trans.isNotEmpty && trans['label'] != null && trans['label'].toString().isNotEmpty) {
      return trans['label'] as String;
    }
    return label;
  }
}

class Order {
  final String id;
  final String userId;
  final String shopId;
  final OrderStatus status;
  final PaymentType? paymentType;
  final double? totalFinalPrice;
  final double? totalEstimatedPrice;
  final DateTime createdAt;

  const Order({
    required this.id,
    required this.userId,
    required this.shopId,
    required this.status,
    this.paymentType,
    this.totalFinalPrice,
    this.totalEstimatedPrice,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final statusStr = json['status'] as String? ?? 'pending';
    OrderStatus status;
    switch (statusStr.toLowerCase()) {
      case 'pending':
        status = OrderStatus.pending;
        break;
      case 'packing':
        status = OrderStatus.packing;
        break;
      case 'delivering':
        status = OrderStatus.delivering;
        break;
      case 'delivered':
        status = OrderStatus.delivered;
        break;
      case 'cancelled':
        status = OrderStatus.cancelled;
        break;
      default:
        status = OrderStatus.pending;
    }

    final paymentStr = json['payment_type'] as String?;
    PaymentType? paymentType;
    if (paymentStr != null) {
      switch (paymentStr.toLowerCase()) {
        case 'cod':
          paymentType = PaymentType.cod;
          break;
        case 'credit':
          paymentType = PaymentType.credit;
          break;
      }
    }

    return Order(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      shopId: json['shop_id'] as String,
      status: status,
      paymentType: paymentType,
      totalFinalPrice: (json['total_final_price'] as num?)?.toDouble(),
      totalEstimatedPrice: (json['total_estimated_price'] as num?)?.toDouble(),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class UserAddress {
  final String id;
  final String userId;
  final String label;
  final String contactName;
  final String contactPhone;
  final String? addressLine1;
  final String? addressLine2;
  final String? landmark;
  final String? houseName;
  final String? village;
  final String? deliveryNote;
  final double? latitude;
  final double? longitude;
  final bool isDefault;

  const UserAddress({
    required this.id,
    required this.userId,
    required this.label,
    required this.contactName,
    required this.contactPhone,
    this.addressLine1,
    this.addressLine2,
    this.landmark,
    this.houseName,
    this.village,
    this.deliveryNote,
    this.latitude,
    this.longitude,
    required this.isDefault,
  });

  factory UserAddress.fromJson(Map<String, dynamic> json) => UserAddress(
        id: json['id'] as String,
        userId: json['user_id'] as String,
        label: json['label'] as String,
        contactName: json['contact_name'] as String,
        contactPhone: json['contact_phone'] as String,
        addressLine1: json['address_line_1'] as String?,
        addressLine2: json['address_line_2'] as String?,
        landmark: json['landmark'] as String?,
        houseName: json['house_name'] as String?,
        village: json['village'] as String?,
        deliveryNote: json['delivery_note'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        isDefault: json['is_default'] as bool? ?? false,
      );
}

class ShopUserCredit {
  final String id;
  final String shopId;
  final String userId;
  final bool isCreditEnabled;
  final double? creditLimit;
  final double? usedAmount;
  final bool isBlocked;

  const ShopUserCredit({
    required this.id,
    required this.shopId,
    required this.userId,
    required this.isCreditEnabled,
    this.creditLimit,
    this.usedAmount,
    required this.isBlocked,
  });

  double get availableCredit =>
      (creditLimit ?? 0) - (usedAmount ?? 0);

  factory ShopUserCredit.fromJson(Map<String, dynamic> json) => ShopUserCredit(
        id: json['id'] as String,
        shopId: json['shop_id'] as String,
        userId: json['user_id'] as String,
        isCreditEnabled: json['is_credit_enabled'] as bool? ?? false,
        creditLimit: (json['credit_limit'] as num?)?.toDouble(),
        usedAmount: (json['used_amount'] as num?)?.toDouble(),
        isBlocked: json['is_blocked'] as bool? ?? false,
      );
}

// ─── Cart (client-side) ───────────────────────────────────────────────────────

class CartItem {
  final Item item;
  final ItemVariant variant;
  double quantity;
  final ItemSellConfig? sellConfig;

  CartItem({
    required this.item,
    required this.variant,
    this.quantity = 1.0,
    this.sellConfig,
  });

  double get subtotal {
    if (sellConfig?.sellMode == SellMode.manual) {
      return (sellConfig?.pricePerBaseUnit ?? 0.0) * quantity;
    } else if (sellConfig?.sellMode == SellMode.dynamic) {
      return (sellConfig?.pricePerBaseUnit ?? 0.0) * (variant.value ?? 1.0) * quantity;
    }
    return (variant.price ?? 0.0) * quantity;
  }
}

class FeedbackModel {
  final String id;
  final String? userId;
  final String type;
  final int? rating;
  final String message;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? userName;

  const FeedbackModel({
    required this.id,
    this.userId,
    required this.type,
    this.rating,
    required this.message,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.userName,
  });

  factory FeedbackModel.fromJson(Map<String, dynamic> json) => FeedbackModel(
        id: json['id'] as String,
        userId: json['user_id'] as String?,
        type: json['type'] as String,
        rating: json['rating'] as int?,
        message: json['message'] as String,
        status: json['status'] as String? ?? 'new',
        createdAt: DateTime.parse(json['created_at'] as String),
        updatedAt: DateTime.parse(json['updated_at'] as String),
        userName: json['users']?['name'] as String?,
      );
}
class ShopReview {
  final String id;
  final String shopId;
  final String userId;
  final String orderId;
  final int productQualityRating;
  final int deliveryExperienceRating;
  final int? deliveryTimelinessRating;
  final int orderAccuracyRating;
  final int overallExperienceRating;
  final String? productQualityDescription;
  final String? productQualityReview;
  final String? deliveryExperienceDescription;
  final String? deliveryTimelinessReview;
  final String? orderAccuracyDescription;
  final String? orderAccuracyReview;
  final String? overallExperienceDescription;
  final String? overallExperienceReview;
  final double finalRating;
  final String? title;
  final String? review;
  final DateTime createdAt;
  final String? reviewerName;

  const ShopReview({
    required this.id,
    required this.shopId,
    required this.userId,
    required this.orderId,
    required this.productQualityRating,
    required this.deliveryExperienceRating,
    this.deliveryTimelinessRating,
    required this.orderAccuracyRating,
    required this.overallExperienceRating,
    this.productQualityDescription,
    this.productQualityReview,
    this.deliveryExperienceDescription,
    this.deliveryTimelinessReview,
    this.orderAccuracyDescription,
    this.orderAccuracyReview,
    this.overallExperienceDescription,
    this.overallExperienceReview,
    required this.finalRating,
    this.title,
    this.review,
    required this.createdAt,
    this.reviewerName,
  });

  factory ShopReview.fromJson(Map<String, dynamic> json) => ShopReview(
        id: json['id'] as String,
        shopId: json['shop_id'] as String,
        userId: json['user_id'] as String,
        orderId: json['order_id'] as String,
        productQualityRating: json['product_quality_rating'] as int,
        deliveryExperienceRating: json['delivery_experience_rating'] as int,
        deliveryTimelinessRating: json['delivery_timeliness_rating'] as int?,
        orderAccuracyRating: json['order_accuracy_rating'] as int,
        overallExperienceRating: json['overall_experience_rating'] as int,
        productQualityDescription: json['product_quality_description'] as String?,
        productQualityReview: json['product_quality_review'] as String?,
        deliveryExperienceDescription: json['delivery_experience_description'] as String?,
        deliveryTimelinessReview: json['delivery_timeliness_review'] as String?,
        orderAccuracyDescription: json['order_accuracy_description'] as String?,
        orderAccuracyReview: json['order_accuracy_review'] as String?,
        overallExperienceDescription: json['overall_experience_description'] as String?,
        overallExperienceReview: json['overall_experience_review'] as String?,
        finalRating: (json['final_rating'] as num).toDouble(),
        title: json['title'] as String?,
        review: json['review'] as String?,
        createdAt: DateTime.parse(json['created_at'] as String),
        reviewerName: json['users']?['name'] as String?,
      );
}

class ShopRatingSummary {
  final String shopId;
  final double averageRating;
  final int totalReviews;
  final int stars;
  final double avgProductQuality;
  final double avgDeliveryTimeliness;
  final double avgOrderAccuracy;
  final double avgOverallExperience;
  final int commissionComplianceStars;
  final int orderPerformanceStars;
  final int salesPerformanceStars;
  final DateTime updatedAt;

  const ShopRatingSummary({
    required this.shopId,
    required this.averageRating,
    required this.totalReviews,
    required this.stars,
    required this.avgProductQuality,
    required this.avgDeliveryTimeliness,
    required this.avgOrderAccuracy,
    required this.avgOverallExperience,
    required this.commissionComplianceStars,
    required this.orderPerformanceStars,
    required this.salesPerformanceStars,
    required this.updatedAt,
  });

  factory ShopRatingSummary.fromJson(Map<String, dynamic> json) => ShopRatingSummary(
        shopId: json['shop_id'] as String,
        averageRating: (json['average_rating'] as num? ?? 0.0).toDouble(),
        totalReviews: json['total_reviews'] as int? ?? 0,
        stars: json['stars'] as int? ?? 0,
        avgProductQuality: (json['avg_product_quality'] as num? ?? 0.0).toDouble(),
        avgDeliveryTimeliness: (json['avg_delivery_timeliness'] as num? ?? 0.0).toDouble(),
        avgOrderAccuracy: (json['avg_order_accuracy'] as num? ?? 0.0).toDouble(),
        avgOverallExperience: (json['avg_overall_experience'] as num? ?? 0.0).toDouble(),
        commissionComplianceStars: json['commission_compliance_stars'] as int? ?? 0,
        orderPerformanceStars: json['order_performance_stars'] as int? ?? 0,
        salesPerformanceStars: json['sales_performance_stars'] as int? ?? 0,
        updatedAt: DateTime.parse(json['updated_at'] as String? ?? DateTime.now().toIso8601String()),
      );
}
