import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/supabase_client.dart';
import '../../theme/theme_service.dart';
import 'vendor_drawer.dart';

// ─── Data Models ─────────────────────────────────────────────────────────────

class _ShopItem {
  final String id;
  final String name;
  const _ShopItem({required this.id, required this.name});
}

class _KpiData {
  final double totalSales;
  final double? salesChangePercent;
  final int totalOrders;
  final double? ordersChangePercent;
  final double itemsSold;
  final double avgOrderValue;
  final double paidAmount;
  final double creditSales;
  final double outstandingCredit;
  final double cancellationRate;
  final int cancelledOrdersCount;

  const _KpiData({
    required this.totalSales,
    this.salesChangePercent,
    required this.totalOrders,
    this.ordersChangePercent,
    required this.itemsSold,
    required this.avgOrderValue,
    required this.paidAmount,
    required this.creditSales,
    required this.outstandingCredit,
    required this.cancellationRate,
    required this.cancelledOrdersCount,
  });
}

class _SalesTrendPoint {
  final String date;
  final String label;
  final double sales;
  final int ordersCount;
  const _SalesTrendPoint({
    required this.date,
    required this.label,
    required this.sales,
    required this.ordersCount,
  });
}

class _StatusBreakdownItem {
  final String status;
  final int count;
  final double amount;
  const _StatusBreakdownItem({required this.status, required this.count, required this.amount});
}

class _PaymentBreakdown {
  final int codCount;
  final double codAmount;
  final int creditCount;
  final double creditAmount;
  const _PaymentBreakdown({
    required this.codCount,
    required this.codAmount,
    required this.creditCount,
    required this.creditAmount,
  });
}

class _DynamicPriceSummary {
  final int adjustedOrdersCount;
  final double totalEstimated;
  final double totalFinal;
  final double difference;
  final double differencePercent;
  const _DynamicPriceSummary({
    required this.adjustedOrdersCount,
    required this.totalEstimated,
    required this.totalFinal,
    required this.difference,
    required this.differencePercent,
  });
}

class _DeliveryPerformance {
  final int morningCount;
  final int eveningCount;
  final int deliveredCount;
  final int pendingDeliveriesCount;
  const _DeliveryPerformance({
    required this.morningCount,
    required this.eveningCount,
    required this.deliveredCount,
    required this.pendingDeliveriesCount,
  });
}

class _TopProductItem {
  final String itemId;
  final String name;
  final String categoryName;
  final String? imageUrl;
  final double quantitySold;
  final int ordersCount;
  final double totalSales;
  final double avgPrice;
  final bool isDynamic;
  const _TopProductItem({
    required this.itemId,
    required this.name,
    required this.categoryName,
    this.imageUrl,
    required this.quantitySold,
    required this.ordersCount,
    required this.totalSales,
    required this.avgPrice,
    required this.isDynamic,
  });
}

class _CategoryPerformanceItem {
  final String categoryId;
  final String name;
  final double totalSales;
  final int ordersCount;
  final double percentage;
  const _CategoryPerformanceItem({
    required this.categoryId,
    required this.name,
    required this.totalSales,
    required this.ordersCount,
    required this.percentage,
  });
}

class _ReportOrderItem {
  final String id;
  final String orderNumber;
  final String customerName;
  final String customerPhone;
  final String date;
  final DateTime createdAt;
  final String? deliveryDate;
  final String? deliverySlot;
  final String paymentType;
  final String status;
  final double total;
  final int itemsCount;
  final String itemsSummary;
  final String addressSummary;

  const _ReportOrderItem({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    required this.customerPhone,
    required this.date,
    required this.createdAt,
    this.deliveryDate,
    this.deliverySlot,
    required this.paymentType,
    required this.status,
    required this.total,
    required this.itemsCount,
    required this.itemsSummary,
    required this.addressSummary,
  });
}

class _CreditLedgerItem {
  final String userId;
  final String name;
  final String phone;
  final double? creditLimit;
  final double usedAmount;
  final double availableCredit;
  final bool isBlocked;
  final bool isCreditEnabled;
  final String? lastUsedAt;

  const _CreditLedgerItem({
    required this.userId,
    required this.name,
    required this.phone,
    this.creditLimit,
    required this.usedAmount,
    required this.availableCredit,
    required this.isBlocked,
    required this.isCreditEnabled,
    this.lastUsedAt,
  });
}

class _CustomerItem {
  final String userId;
  final String name;
  final String phone;
  final String? email;
  final int totalOrders;
  final double totalPurchased;
  final double creditOutstanding;
  final bool isCreditEnabled;
  final String? lastOrderDate;

  const _CustomerItem({
    required this.userId,
    required this.name,
    required this.phone,
    this.email,
    required this.totalOrders,
    required this.totalPurchased,
    required this.creditOutstanding,
    required this.isCreditEnabled,
    this.lastOrderDate,
  });
}

class _ReportData {
  final List<_ShopItem> shops;
  final String? selectedShopId;
  final String shopName;
  final DateTimeRange dateRange;
  final String preset;
  final _KpiData kpis;
  final List<_SalesTrendPoint> salesTrend;
  final List<_StatusBreakdownItem> statusBreakdown;
  final _PaymentBreakdown paymentBreakdown;
  final _DynamicPriceSummary dynamicPriceSummary;
  final _DeliveryPerformance deliveryPerformance;
  final List<_TopProductItem> topProducts;
  final List<_CategoryPerformanceItem> categoryPerformance;
  final List<_ReportOrderItem> orders;
  final List<_CreditLedgerItem> creditLedger;
  final List<_CustomerItem> customers;

  const _ReportData({
    required this.shops,
    required this.selectedShopId,
    this.shopName = '',
    required this.dateRange,
    this.preset = 'this_month',
    required this.kpis,
    required this.salesTrend,
    required this.statusBreakdown,
    required this.paymentBreakdown,
    required this.dynamicPriceSummary,
    required this.deliveryPerformance,
    required this.topProducts,
    required this.categoryPerformance,
    required this.orders,
    required this.creditLedger,
    required this.customers,
  });

  factory _ReportData.empty() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return _ReportData(
      shops: [],
      selectedShopId: null,
      dateRange: DateTimeRange(start: today, end: today),
      kpis: const _KpiData(
        totalSales: 0,
        totalOrders: 0,
        itemsSold: 0,
        avgOrderValue: 0,
        paidAmount: 0,
        creditSales: 0,
        outstandingCredit: 0,
        cancellationRate: 0,
        cancelledOrdersCount: 0,
      ),
      salesTrend: [],
      statusBreakdown: [],
      paymentBreakdown: const _PaymentBreakdown(codCount: 0, codAmount: 0, creditCount: 0, creditAmount: 0),
      dynamicPriceSummary: const _DynamicPriceSummary(adjustedOrdersCount: 0, totalEstimated: 0, totalFinal: 0, difference: 0, differencePercent: 0),
      deliveryPerformance: const _DeliveryPerformance(morningCount: 0, eveningCount: 0, deliveredCount: 0, pendingDeliveriesCount: 0),
      topProducts: [],
      categoryPerformance: [],
      orders: [],
      creditLedger: [],
      customers: [],
    );
  }
}

// ─── Localized Translations Helper ───────────────────────────────────────────

class _VendorReportsL10n {
  final String lang;
  _VendorReportsL10n(BuildContext context)
      : lang = Localizations.localeOf(context).languageCode;

  bool get isMl => lang == 'ml';

  String get screenTitle => isMl ? 'വിൽപ്പന & ബിസിനസ് റിപ്പോർട്ട്' : 'Sales & Reports';
  String get tabOverview => isMl ? 'അവലോകനം' : 'Overview';
  String get tabOrders => isMl ? 'ഓർഡറുകൾ' : 'Orders';
  String get tabProducts => isMl ? 'ഉൽപ്പന്നങ്ങൾ' : 'Products';
  String get tabPayments => isMl ? 'പേയ്‌മെന്റുകൾ' : 'Payments';
  String get tabCustomers => isMl ? 'ഉപഭോക്താക്കൾ' : 'Customers';

  String get filterToday => isMl ? 'ഇന്ന്' : 'Today';
  String get filterYesterday => isMl ? 'ഇന്നലെ' : 'Yesterday';
  String get filterLast7Days => isMl ? 'കഴിഞ്ഞ 7 ദിവസം' : 'Last 7 Days';
  String get filterThisMonth => isMl ? 'ഈ മാസം' : 'This Month';
  String get filterLastMonth => isMl ? 'കഴിഞ്ഞ മാസം' : 'Last Month';
  String get filterCustom => isMl ? 'മറ്റൊരു തീയതി' : 'Custom';

  String get exportCsv => isMl ? 'CSV എക്സ്പോർട്ട്' : 'Export CSV';
  String get refresh => isMl ? 'റിഫ്രഷ്' : 'Refresh';
  String get tryAgain => isMl ? 'വീണ്ടും ശ്രമിക്കുക' : 'Try Again';
  String get failedToLoad => isMl ? 'വിവരങ്ങൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല' : 'Failed to load report data';

  String get kpiTotalSales => isMl ? 'ആകെ വിൽപ്പന' : 'Total Sales';
  String get kpiOrders => isMl ? 'ആകെ ഓർഡറുകൾ' : 'Orders';
  String get kpiItemsSold => isMl ? 'വിറ്റ ഉൽപ്പന്നങ്ങൾ' : 'Items Sold';
  String get kpiAvgOrder => isMl ? 'ശരാശരി ഓർഡർ' : 'Avg. Order';
  String get kpiPaid => isMl ? 'ലഭിച്ച തുക' : 'Paid Amount';
  String get kpiCreditSales => isMl ? 'ക്രെഡിറ്റ് വിൽപ്പന' : 'Credit Sales';
  String get kpiOutstanding => isMl ? 'നൽകാനുള്ള തുക' : 'Outstanding';
  String get kpiCancellation => isMl ? 'റദ്ദാക്കിയ നിരക്ക്' : 'Cancellation Rate';

  String get vsPrevPeriod => isMl ? 'മുൻ കാലയളവുമായി താരതമ്യം' : 'vs prev period';
  String get nonCancelledOrders => isMl ? 'റദ്ദാക്കാത്ത ഓർഡറുകൾ' : 'Non-cancelled orders';
  String get totalCreatedOrders => isMl ? 'ആകെ സൃഷ്ടിച്ച ഓർഡറുകൾ' : 'Total created orders';
  String get unitsPacked => isMl ? 'യൂണിറ്റുകൾ / കി.ഗ്രാം' : 'Units / kg packed';
  String get codPlusRepayments => isMl ? 'ഡെലിവറി ചെയ്ത COD + തിരിച്ചടവുകൾ' : 'COD delivered + repayments';
  String get ordersOnCredit => isMl ? 'ക്രെഡിറ്റിൽ എടുത്ത ഓർഡറുകൾ' : 'Orders placed on credit';
  String get liveUnpaidBalance => isMl ? 'ആകെ നൽകാനുള്ള കുടിശ്ശിക' : 'Live unpaid credit balance';
  String get cancelledOrders => isMl ? 'റദ്ദാക്കിയ ഓർഡറുകൾ' : 'cancelled orders';

  String get salesTrend => isMl ? 'വിൽപ്പന ട്രെൻഡ്' : 'Sales Trend';
  String get sales => isMl ? 'വിൽപ്പന' : 'Sales';
  String get orders => isMl ? 'ഓർഡറുകൾ' : 'Orders';

  String get ordersByStatus => isMl ? 'സ്റ്റാറ്റസ് തിരിച്ചുള്ള ഓർഡറുകൾ' : 'Orders by Status';
  String get viewAllOrders => isMl ? 'എല്ലാം കാണുക' : 'View All Orders';

  String get paymentBreakdown => isMl ? 'പേയ്‌മെന്റ് വിവരങ്ങൾ' : 'Payment Breakdown';
  String get paymentsLedger => isMl ? 'പേയ്‌മെന്റ് ലെഡ്ജർ' : 'Payments Ledger';
  String get cod => isMl ? 'ക്യാഷ് ഓൺ ഡെലിവറി' : 'Cash on Delivery (COD)';
  String get creditPayLater => isMl ? 'ക്രെഡിറ്റ് പേയ് ലേറ്റർ' : 'Credit Pay Later';
  String get liveOutstandingCredit => isMl ? 'ആകെ നൽകാനുള്ള കുടിശ്ശിക' : 'Live Outstanding Credit';
  String get viewCreditCustomers => isMl ? 'ക്രെഡിറ്റ് ഉപഭോക്താക്കൾ' : 'View Credit Customers';

  String get dynamicPriceAdjustments => isMl ? 'തൂക്കത്തിനനുസരിച്ചുള്ള വില മാറ്റങ്ങൾ' : 'Dynamic Price Adjustments';
  String get dynamicPriceSubtext => isMl ? 'മാംസം, മത്സ്യം, പച്ചക്കറികൾ എന്നിവ തൂക്കി പാക്ക് ചെയ്തതിൻ്റെ കണക്ക്' : 'For variable-weight products weighed & packed by your shop.';
  String get adjustedOrders => isMl ? 'തൂക്കം മാറ്റിയവ' : 'Adjusted Orders';
  String get estimated => isMl ? 'കണക്കാക്കിയത്' : 'Estimated';
  String get finalPacked => isMl ? 'അന്തിമ തുക' : 'Final Packed';
  String get netDifference => isMl ? 'ആകെ വ്യത്യാസം' : 'Net Difference';

  String get deliveryPerformance => isMl ? 'ഡെലിവറി പ്രകടനം' : 'Delivery Performance';
  String get deliverySubtext => isMl ? 'ഡെലിവറി സ്ലോട്ടുകളുടെയും പൂർത്തീകരണത്തിൻ്റെയും വിവരങ്ങൾ' : 'Scheduled slot breakdown and completed fulfillment rate.';
  String get morning => isMl ? 'രാവിലെ' : 'Morning';
  String get evening => isMl ? 'വൈകുന്നേരം' : 'Evening';
  String get delivered => isMl ? 'ഡെലിവറി ചെയ്തവ' : 'Delivered';
  String get pendingDispatch => isMl ? 'ഡെലിവറി അയക്കാനുള്ളവ' : 'Pending Delivery Dispatch';

  String get topSellingProducts => isMl ? 'കൂടുതൽ വിറ്റ ഉൽപ്പന്നങ്ങൾ' : 'Top Selling Products';
  String get allProducts => isMl ? 'എല്ലാ ഉൽപ്പന്നങ്ങളും' : 'All Products';
  String get noProductsSold => isMl ? 'ഈ കാലയളവിൽ ഉൽപ്പന്നങ്ങളൊന്നും വിറ്റിട്ടില്ല.' : 'No products sold in this period.';
  String get categoryPerformance => isMl ? 'വിഭാഗങ്ങളുടെ പ്രകടനം' : 'Category Performance';
  String get byRevenueShare => isMl ? 'വരുമാന വിഹിതം പ്രകാരം' : 'By Revenue Share';
  String get noCategoryData => isMl ? 'വിഭാഗങ്ങളുടെ വിവരങ്ങൾ ലഭ്യമല്ല.' : 'No category data available.';

  String get searchOrders => isMl ? 'ഓർഡർ ഐഡി, പേര്, ഫോൺ നമ്പർ നൽകി തിരയുക...' : 'Search orders by ID, name or phone...';
  String get allStatuses => isMl ? 'എല്ലാ സ്റ്റാറ്റസുകളും' : 'All Statuses';
  String get allPayments => isMl ? 'എല്ലാ പേയ്‌മെന്റ് രീതികളും' : 'All Payments';
  String get showingOrders => isMl ? 'ഓർഡറുകൾ കാണിക്കുന്നു' : 'Showing orders';
  String get nonCancelledTotal => isMl ? 'റദ്ദാക്കാത്ത ആകെ തുക' : 'Non-Cancelled Total';
  String get noOrdersFound => isMl ? 'ഓർഡറുകളൊന്നും കണ്ടെത്തിയില്ല' : 'No orders found';
  String get processOrder => isMl ? 'ഓർഡർ പ്രോസസ് ചെയ്യുക' : 'Process Order';

  String get categorySummary => isMl ? 'വിഭാഗങ്ങളുടെ സംഗ്രഹം' : 'Category Performance Summary';
  String get searchProducts => isMl ? 'ഉൽപ്പന്നം തിരയുക...' : 'Search products by name...';
  String get allCategories => isMl ? 'എല്ലാ വിഭാഗങ്ങളും' : 'All Categories';
  String get sortSales => isMl ? 'വിൽപ്പന പ്രകാരം' : 'Sort by Sales (Highest)';
  String get sortUnits => isMl ? 'യൂണിറ്റ് പ്രകാരം' : 'Sort by Quantity Sold';
  String get sortOrders => isMl ? 'ഓർഡറുകൾ പ്രകാരം' : 'Sort by Order Count';
  String get noProductsFound => isMl ? 'ഉൽപ്പന്നങ്ങളൊന്നും കണ്ടെത്തിയില്ല' : 'No products found';
  String get totalUnits => isMl ? 'ആകെ യൂണിറ്റുകൾ' : 'Total Units';

  String get paidCollected => isMl ? 'ലഭിച്ച തുക' : 'PAID / COLLECTED AMOUNT';
  String get paidSubtext => isMl ? 'ഡെലിവറി ചെയ്ത COD + തിരിച്ചടവുകൾ' : 'Delivered COD orders + credit repayments in period';
  String get creditSalesTitle => isMl ? 'ക്രെഡിറ്റ് വിൽപ്പന' : 'CREDIT SALES (SELECTED PERIOD)';
  String get creditSalesSubtext => isMl ? 'സ്റ്റോർ ക്രെഡിറ്റ് ഉപയോഗിച്ച് എടുത്ത ഓർഡറുകൾ' : 'Orders placed using store credit';
  String get currentOutstanding => isMl ? 'ആകെ നൽകാനുള്ള കുടിശ്ശിക' : 'CURRENT OUTSTANDING BALANCE';
  String get outstandingSubtext => isMl ? 'ഉപഭോക്താക്കൾ കടയിൽ നൽകാനുള്ള ആകെ തുക' : 'Total unpaid customer balance across shop';
  String get creditLedgerTitle => isMl ? 'ക്രെഡിറ്റ് കസ്റ്റമേഴ്സ് ലെഡ്ജർ' : 'Credit Customers Ledger';
  String get creditLedgerSubtext => isMl ? 'കടയിൽ ക്രെഡിറ്റ് അക്കൗണ്ടുള്ള ഉപഭോക്താക്കൾ' : 'Customers with approved store credit accounts for your shop.';
  String get searchCustomer => isMl ? 'ഉപഭോക്താവിനെ തിരയുക...' : 'Search customer...';
  String get allAccounts => isMl ? 'എല്ലാ അക്കൗണ്ടുകളും' : 'All Accounts';
  String get withOutstanding => isMl ? 'കുടിശ്ശികയുള്ളവർ' : 'With Outstanding Balance';
  String get blockedAccounts => isMl ? 'ബ്ലോക്ക് ചെയ്ത അക്കൗണ്ടുകൾ' : 'Blocked Accounts';
  String get noLimit => isMl ? 'പരിധിയില്ല' : 'No Limit';
  String get creditLimit => isMl ? 'ക്രെഡിറ്റ് പരിധി' : 'Credit Limit';
  String get outstandingBalance => isMl ? 'നൽകാനുള്ള തുക' : 'Outstanding';
  String get availableCredit => isMl ? 'ലഭ്യമായ തുക' : 'Available Credit';
  String get lastUsed => isMl ? 'അവസാനം ഉപയോഗിച്ചത്' : 'Last Used';
  String get status => isMl ? 'സ്റ്റാറ്റസ്' : 'Status';
  String get active => isMl ? 'സജീവം' : 'Active';
  String get blocked => isMl ? 'ബ്ലോക്ക്' : 'Blocked';
  String get disabled => isMl ? 'പ്രവർത്തനരഹിതം' : 'Disabled';
  String get noCreditFound => isMl ? 'ക്രെഡിറ്റ് അക്കൗണ്ടുകളൊന്നും കണ്ടെത്തിയില്ല' : 'No credit accounts found';

  String get allCustomers => isMl ? 'എല്ലാ ഉപഭോക്താക്കളും' : 'All Customers';
  String get creditAccounts => isMl ? 'ക്രെഡിറ്റ് അക്കൗണ്ടുകൾ' : 'Credit Accounts';
  String get sortPurchased => isMl ? 'വാങ്ങിയ തുക പ്രകാരം' : 'Sort by Total Purchased';
  String get sortCustomerOrders => isMl ? 'ഓർഡറുകൾ പ്രകാരം' : 'Sort by Total Orders';
  String get sortCustomerOutstanding => isMl ? 'കുടിശ്ശിക പ്രകാരം' : 'Sort by Outstanding Balance';
  String get totalPurchases => isMl ? 'ആകെ വാങ്ങിയത്' : 'Total Purchases';
  String get totalOutstandingLabel => isMl ? 'ആകെ നൽകാനുള്ളത്' : 'Total Outstanding';
  String get lifetimeSpent => isMl ? 'ആകെ വാങ്ങിയത്' : 'Lifetime Spent';
  String get lastActive => isMl ? 'അവസാനം സജീവമായത്' : 'Last Active';
  String get noCustomersFound => isMl ? 'ഉപഭോക്താക്കളെയൊന്നും കണ്ടെത്തിയില്ല' : 'No customers found';
}

// ─── Main Screen Widget ──────────────────────────────────────────────────────

class VendorReportsScreen extends StatefulWidget {
  const VendorReportsScreen({super.key});

  @override
  State<VendorReportsScreen> createState() => _VendorReportsScreenState();
}

class _VendorReportsScreenState extends State<VendorReportsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _selectedShopId;
  String _selectedPreset = 'this_month';
  DateTimeRange? _customDateRange;
  late Future<_ReportData> _future;

  // Search & Filter controllers for sub-tabs
  final TextEditingController _ordersSearchCtrl = TextEditingController();
  String _ordersStatusFilter = 'all';
  String _ordersPaymentFilter = 'all';

  final TextEditingController _productsSearchCtrl = TextEditingController();
  String _productsCategoryFilter = 'all';
  String _productsSortBy = 'sales';

  final TextEditingController _paymentsSearchCtrl = TextEditingController();
  String _paymentsFilter = 'all';

  final TextEditingController _customersSearchCtrl = TextEditingController();
  String _customersFilter = 'all';
  String _customersSortBy = 'purchased';

  final NumberFormat _inrFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _future = _fetchData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _ordersSearchCtrl.dispose();
    _productsSearchCtrl.dispose();
    _paymentsSearchCtrl.dispose();
    _customersSearchCtrl.dispose();
    super.dispose();
  }

  void _reload() {
    setState(() {
      _future = _fetchData();
    });
  }

  DateTimeRange _getDateRange(String preset) {
    if (preset == 'custom' && _customDateRange != null) {
      return _customDateRange!;
    }
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    switch (preset) {
      case 'today':
        return DateTimeRange(
          start: today,
          end: today.add(const Duration(days: 1)).subtract(const Duration(milliseconds: 1)),
        );
      case 'yesterday':
        final yest = today.subtract(const Duration(days: 1));
        return DateTimeRange(
          start: yest,
          end: yest.add(const Duration(days: 1)).subtract(const Duration(milliseconds: 1)),
        );
      case 'last_7_days':
        return DateTimeRange(
          start: today.subtract(const Duration(days: 6)),
          end: today.add(const Duration(days: 1)).subtract(const Duration(milliseconds: 1)),
        );
      case 'last_month':
        final start = DateTime(today.year, today.month - 1, 1);
        final end = DateTime(today.year, today.month, 0, 23, 59, 59);
        return DateTimeRange(start: start, end: end);
      case 'this_month':
      default:
        final start = DateTime(today.year, today.month, 1);
        final end = today.add(const Duration(days: 1)).subtract(const Duration(milliseconds: 1));
        return DateTimeRange(start: start, end: end);
    }
  }

  Future<_ReportData> _fetchData() async {
    final user = supabase.auth.currentUser;
    if (user == null) {
      return _ReportData.empty();
    }

    // 1. Fetch owned shops
    final ownedShopsRes = await supabase
        .from('shop_owners')
        .select('shop_id, shops(id, name, type)')
        .eq('user_id', user.id);

    final shops = (ownedShopsRes as List).map((o) {
      final s = o['shops'] as Map?;
      if (s == null) return null;
      return _ShopItem(id: s['id'] as String, name: s['name'] as String);
    }).whereType<_ShopItem>().toList();

    if (shops.isEmpty) {
      return _ReportData.empty();
    }

    final activeShopId = _selectedShopId ?? shops.first.id;
    _selectedShopId ??= activeShopId;
    final shopName = shops.firstWhere((s) => s.id == activeShopId, orElse: () => shops.first).name;

    final range = _getDateRange(_selectedPreset);
    final startIso = range.start.toIso8601String();
    final endIso = range.end.toIso8601String();

    // Previous comparative period
    final duration = range.end.difference(range.start);
    final prevStart = range.start.subtract(duration);
    final prevEnd = range.start.subtract(const Duration(milliseconds: 1));
    final prevStartIso = prevStart.toIso8601String();
    final prevEndIso = prevEnd.toIso8601String();

    // Parallel fetch
    final results = await Future.wait([
      // Current orders
      supabase
          .from('orders')
          .select('''
            id, order_number, user_id, shop_id, total_estimated_price, total_final_price, payment_type, status, delivery_date, delivery_slot, created_at, updated_at,
            users(id, name, phone, email),
            order_addresses(contact_name, contact_phone, address_line_1, address_line_2, landmark),
            order_items(
              *,
              items(id, name, category_id, categories(id, name)),
              item_variants(label, value, price, image_url)
            )
          ''')
          .eq('shop_id', activeShopId)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', ascending: false),

      // Previous period orders
      supabase
          .from('orders')
          .select('id, total_final_price, total_estimated_price, status')
          .eq('shop_id', activeShopId)
          .gte('created_at', prevStartIso)
          .lte('created_at', prevEndIso),

      // Customer credit ledger
      supabase
          .from('shop_user_credit')
          .select('id, shop_id, user_id, is_credit_enabled, credit_limit, used_amount, is_blocked, last_credit_used_at, created_at, users(id, name, phone, email)')
          .eq('shop_id', activeShopId),

      // Repayments in period
      supabase
          .from('customer_repayment_logs')
          .select('id, shop_id, user_id, amount, notes, created_at')
          .eq('shop_id', activeShopId)
          .gte('created_at', startIso)
          .lte('created_at', endIso)
    ]);

    final rawOrders = (results[0] as List?) ?? [];
    final prevOrders = (results[1] as List?) ?? [];
    final rawCredits = (results[2] as List?) ?? [];
    final rawRepayments = (results[3] as List?) ?? [];

    // Process KPIs
    final totalOrdersCount = rawOrders.length;
    final nonCancelledOrders = rawOrders.where((o) => o['status'] != 'cancelled').toList();
    final cancelledOrders = rawOrders.where((o) => o['status'] == 'cancelled').toList();
    final deliveredOrders = rawOrders.where((o) => o['status'] == 'delivered').toList();

    double totalSales = 0;
    for (final o in nonCancelledOrders) {
      final p = o['total_final_price'] ?? o['total_estimated_price'] ?? 0;
      totalSales += (p as num).toDouble();
    }

    final prevNonCancelled = prevOrders.where((o) => o['status'] != 'cancelled').toList();
    double prevTotalSales = 0;
    for (final o in prevNonCancelled) {
      final p = o['total_final_price'] ?? o['total_estimated_price'] ?? 0;
      prevTotalSales += (p as num).toDouble();
    }

    double? salesChangePercent;
    if (prevTotalSales > 0) {
      salesChangePercent = double.parse((((totalSales - prevTotalSales) / prevTotalSales) * 100).toStringAsFixed(1));
    }

    double? ordersChangePercent;
    if (prevOrders.isNotEmpty) {
      ordersChangePercent = double.parse((((totalOrdersCount - prevOrders.length) / prevOrders.length) * 100).toStringAsFixed(1));
    }

    double itemsSold = 0;
    for (final o in nonCancelledOrders) {
      final items = (o['order_items'] as List?) ?? [];
      for (final oi in items) {
        if (oi['status'] == 'rejected') continue;
        final v = (oi['actual_value'] ?? oi['requested_value'] ?? 1) as num;
        itemsSold += v.toDouble();
      }
    }

    final avgOrderValue = nonCancelledOrders.isNotEmpty ? totalSales / nonCancelledOrders.length : 0.0;

    // Payments
    double codDeliveredSales = 0;
    int codCount = 0;
    double codTotalAmount = 0;
    int creditCount = 0;
    double creditTotalAmount = 0;

    for (final o in nonCancelledOrders) {
      final pType = (o['payment_type'] ?? 'cod').toString().toLowerCase();
      final p = ((o['total_final_price'] ?? o['total_estimated_price'] ?? 0) as num).toDouble();

      if (pType == 'credit') {
        creditCount++;
        creditTotalAmount += p;
      } else {
        codCount++;
        codTotalAmount += p;
        if (o['status'] == 'delivered') {
          codDeliveredSales += p;
        }
      }
    }

    double repaymentsSum = 0;
    for (final r in rawRepayments) {
      repaymentsSum += ((r['amount'] ?? 0) as num).toDouble();
    }
    final paidAmount = codDeliveredSales + repaymentsSum;

    double outstandingCredit = 0;
    for (final c in rawCredits) {
      outstandingCredit += ((c['used_amount'] ?? 0) as num).toDouble();
    }

    final cancellationRate = totalOrdersCount > 0 ? (cancelledOrders.length / totalOrdersCount) * 100 : 0.0;

    final kpis = _KpiData(
      totalSales: totalSales,
      salesChangePercent: salesChangePercent,
      totalOrders: totalOrdersCount,
      ordersChangePercent: ordersChangePercent,
      itemsSold: itemsSold,
      avgOrderValue: avgOrderValue,
      paidAmount: paidAmount,
      creditSales: creditTotalAmount,
      outstandingCredit: outstandingCredit,
      cancellationRate: double.parse(cancellationRate.toStringAsFixed(1)),
      cancelledOrdersCount: cancelledOrders.length,
    );

    // Sales Trend (Group by day)
    final Map<String, _SalesTrendPoint> trendMap = {};
    for (final o in nonCancelledOrders) {
      final cAt = DateTime.parse(o['created_at'] as String).toLocal();
      final dateKey = DateFormat('yyyy-MM-dd').format(cAt);
      final label = DateFormat('d MMM').format(cAt);
      final p = ((o['total_final_price'] ?? o['total_estimated_price'] ?? 0) as num).toDouble();

      if (!trendMap.containsKey(dateKey)) {
        trendMap[dateKey] = _SalesTrendPoint(date: dateKey, label: label, sales: p, ordersCount: 1);
      } else {
        final existing = trendMap[dateKey]!;
        trendMap[dateKey] = _SalesTrendPoint(
          date: dateKey,
          label: label,
          sales: existing.sales + p,
          ordersCount: existing.ordersCount + 1,
        );
      }
    }
    final salesTrend = trendMap.values.toList()..sort((a, b) => a.date.compareTo(b.date));

    // Status breakdown
    final Map<String, int> statusCounts = {'pending': 0, 'delivering': 0, 'packing': 0, 'delivered': 0, 'cancelled': 0};
    final Map<String, double> statusAmounts = {'pending': 0, 'delivering': 0, 'packing': 0, 'delivered': 0, 'cancelled': 0};
    for (final o in rawOrders) {
      final st = (o['status'] ?? 'pending').toString().toLowerCase();
      final p = ((o['total_final_price'] ?? o['total_estimated_price'] ?? 0) as num).toDouble();
      statusCounts[st] = (statusCounts[st] ?? 0) + 1;
      statusAmounts[st] = (statusAmounts[st] ?? 0) + p;
    }
    final statusBreakdown = statusCounts.entries.map((e) {
      return _StatusBreakdownItem(status: e.key, count: e.value, amount: statusAmounts[e.key] ?? 0);
    }).toList();

    // Payment breakdown
    final paymentBreakdown = _PaymentBreakdown(
      codCount: codCount,
      codAmount: codTotalAmount,
      creditCount: creditCount,
      creditAmount: creditTotalAmount,
    );

    // Products & Categories
    final Map<String, _TopProductItem> productMap = {};
    final Map<String, _CategoryPerformanceItem> categoryMap = {};
    double dynamicEstSum = 0;
    double dynamicFinalSum = 0;
    final Set<String> dynamicOrdersSet = {};

    int morningCount = 0;
    int eveningCount = 0;
    int pendingDeliveriesCount = 0;

    for (final o in nonCancelledOrders) {
      // Delivery
      final slot = (o['delivery_slot'] ?? '').toString().toLowerCase();
      if (slot.contains('morning')) morningCount++;
      if (slot.contains('evening')) eveningCount++;
      if (o['status'] == 'pending' || o['status'] == 'packing') pendingDeliveriesCount++;

      final items = (o['order_items'] as List?) ?? [];
      for (final oi in items) {
        if (oi['status'] == 'rejected') continue;
        final itemObj = oi['items'] as Map?;
        final catObj = itemObj?['categories'] as Map?;
        final variantObj = oi['item_variants'] as Map?;

        final itemId = (oi['item_id'] ?? '').toString();
        final itemName = (itemObj?['name'] ?? 'Product').toString();
        final catId = (itemObj?['category_id'] ?? 'general').toString();
        final catName = (catObj?['name'] ?? 'General').toString();
        final vType = (oi['variant_type'] ?? '').toString().toLowerCase();
        final isDynamic = vType == 'dynamic' || vType == 'portion';

        final val = ((oi['actual_value'] ?? oi['requested_value'] ?? 1) as num).toDouble();
        final sales = ((oi['final_price'] ?? oi['estimated_price'] ?? 0) as num).toDouble();
        final imgUrl = variantObj?['image_url'] as String?;

        if (!productMap.containsKey(itemId)) {
          productMap[itemId] = _TopProductItem(
            itemId: itemId,
            name: itemName,
            categoryName: catName,
            imageUrl: imgUrl,
            quantitySold: val > 0 ? val : 1,
            ordersCount: 1,
            totalSales: sales,
            avgPrice: sales,
            isDynamic: isDynamic,
          );
        } else {
          final cur = productMap[itemId]!;
          final newQty = cur.quantitySold + (val > 0 ? val : 1);
          final newSales = cur.totalSales + sales;
          final newOrders = cur.ordersCount + 1;
          productMap[itemId] = _TopProductItem(
            itemId: itemId,
            name: itemName,
            categoryName: catName,
            imageUrl: cur.imageUrl ?? imgUrl,
            quantitySold: newQty,
            ordersCount: newOrders,
            totalSales: newSales,
            avgPrice: newQty > 0 ? newSales / newQty : 0,
            isDynamic: isDynamic,
          );
        }

        // Category Map
        if (!categoryMap.containsKey(catId)) {
          categoryMap[catId] = _CategoryPerformanceItem(
            categoryId: catId,
            name: catName,
            totalSales: sales,
            ordersCount: 1,
            percentage: 0,
          );
        } else {
          final cur = categoryMap[catId]!;
          categoryMap[catId] = _CategoryPerformanceItem(
            categoryId: catId,
            name: catName,
            totalSales: cur.totalSales + sales,
            ordersCount: cur.ordersCount + 1,
            percentage: 0,
          );
        }

        if (isDynamic) {
          dynamicOrdersSet.add(o['id'] as String);
          dynamicEstSum += ((oi['estimated_price'] ?? 0) as num).toDouble();
          dynamicFinalSum += ((oi['final_price'] ?? 0) as num).toDouble();
        }
      }
    }

    final topProducts = productMap.values.toList()..sort((a, b) => b.totalSales.compareTo(a.totalSales));

    final totalCategorySales = categoryMap.values.fold<double>(0, (sum, c) => sum + c.totalSales);
    final categoryPerformance = categoryMap.values.map((c) {
      final pct = totalCategorySales > 0 ? (c.totalSales / totalCategorySales) * 100 : 0.0;
      return _CategoryPerformanceItem(
        categoryId: c.categoryId,
        name: c.name,
        totalSales: c.totalSales,
        ordersCount: c.ordersCount,
        percentage: double.parse(pct.toStringAsFixed(1)),
      );
    }).toList()..sort((a, b) => b.totalSales.compareTo(a.totalSales));

    final dynamicDiff = dynamicFinalSum - dynamicEstSum;
    final dynamicDiffPct = dynamicEstSum > 0 ? (dynamicDiff / dynamicEstSum) * 100 : 0.0;
    final dynamicPriceSummary = _DynamicPriceSummary(
      adjustedOrdersCount: dynamicOrdersSet.length,
      totalEstimated: dynamicEstSum,
      totalFinal: dynamicFinalSum,
      difference: dynamicDiff,
      differencePercent: double.parse(dynamicDiffPct.toStringAsFixed(1)),
    );

    final deliveryPerformance = _DeliveryPerformance(
      morningCount: morningCount,
      eveningCount: eveningCount,
      deliveredCount: deliveredOrders.length,
      pendingDeliveriesCount: pendingDeliveriesCount,
    );

    // Orders List
    final List<_ReportOrderItem> ordersList = [];
    for (final o in rawOrders) {
      final u = o['users'] as Map?;
      final addr = o['order_addresses'] as Map?;
      final items = (o['order_items'] as List?) ?? [];

      final summaryParts = items.map((oi) {
        final it = oi['items'] as Map?;
        final iName = it?['name'] ?? 'Item';
        final val = oi['actual_value'] ?? oi['requested_value'] ?? 1;
        return '$iName ($val)';
      }).join(', ');

      final addrSummary = addr != null
          ? '${addr['address_line_1'] ?? ''} ${addr['landmark'] ?? ''}'.trim()
          : '';

      final cAt = DateTime.parse(o['created_at'] as String).toLocal();
      final p = ((o['total_final_price'] ?? o['total_estimated_price'] ?? 0) as num).toDouble();

      ordersList.add(_ReportOrderItem(
        id: o['id'] as String,
        orderNumber: (o['order_number'] ?? o['id'].toString().substring(0, 8)).toString(),
        customerName: (u?['name'] ?? 'Guest Customer').toString(),
        customerPhone: (u?['phone'] ?? addr?['contact_phone'] ?? '').toString(),
        date: DateFormat('d MMM yyyy, h:mm a').format(cAt),
        createdAt: cAt,
        deliveryDate: o['delivery_date'] as String?,
        deliverySlot: o['delivery_slot'] as String?,
        paymentType: (o['payment_type'] ?? 'cod').toString().toLowerCase(),
        status: (o['status'] ?? 'pending').toString().toLowerCase(),
        total: p,
        itemsCount: items.length,
        itemsSummary: summaryParts.isNotEmpty ? summaryParts : 'No item details',
        addressSummary: addrSummary,
      ));
    }

    // Credit Ledger
    final List<_CreditLedgerItem> creditLedgerList = [];
    for (final c in rawCredits) {
      final u = c['users'] as Map?;
      final limit = c['credit_limit'] != null ? ((c['credit_limit'] as num).toDouble()) : null;
      final used = ((c['used_amount'] ?? 0) as num).toDouble();
      final avail = limit != null ? (limit - used).clamp(0, double.infinity).toDouble() : double.infinity;

      creditLedgerList.add(_CreditLedgerItem(
        userId: (c['user_id'] ?? '').toString(),
        name: (u?['name'] ?? 'Customer').toString(),
        phone: (u?['phone'] ?? '').toString(),
        creditLimit: limit,
        usedAmount: used,
        availableCredit: avail,
        isBlocked: c['is_blocked'] == true,
        isCreditEnabled: c['is_credit_enabled'] == true,
        lastUsedAt: c['last_credit_used_at'] != null ? DateFormat('d MMM yyyy').format(DateTime.parse(c['last_credit_used_at'] as String)) : null,
      ));
    }
    creditLedgerList.sort((a, b) => b.usedAmount.compareTo(a.usedAmount));

    // Customers List
    final Map<String, _CustomerItem> customerMap = {};
    for (final o in rawOrders) {
      final uid = (o['user_id'] ?? '').toString();
      if (uid.isEmpty) continue;
      final u = o['users'] as Map?;
      final name = (u?['name'] ?? 'Customer').toString();
      final phone = (u?['phone'] ?? '').toString();
      final email = u?['email'] as String?;
      final p = ((o['total_final_price'] ?? o['total_estimated_price'] ?? 0) as num).toDouble();
      final cAt = DateTime.parse(o['created_at'] as String).toLocal();
      final dStr = DateFormat('d MMM yyyy').format(cAt);

      // Find outstanding credit
      final creditMatch = rawCredits.firstWhere(
        (c) => c['user_id'] == uid,
        orElse: () => null,
      );
      final outstanding = creditMatch != null ? ((creditMatch['used_amount'] ?? 0) as num).toDouble() : 0.0;
      final isCreditEnabled = creditMatch != null ? creditMatch['is_credit_enabled'] == true : false;

      if (!customerMap.containsKey(uid)) {
        customerMap[uid] = _CustomerItem(
          userId: uid,
          name: name,
          phone: phone,
          email: email,
          totalOrders: 1,
          totalPurchased: o['status'] != 'cancelled' ? p : 0,
          creditOutstanding: outstanding,
          isCreditEnabled: isCreditEnabled,
          lastOrderDate: dStr,
        );
      } else {
        final cur = customerMap[uid]!;
        customerMap[uid] = _CustomerItem(
          userId: uid,
          name: name,
          phone: phone,
          email: email ?? cur.email,
          totalOrders: cur.totalOrders + 1,
          totalPurchased: cur.totalPurchased + (o['status'] != 'cancelled' ? p : 0),
          creditOutstanding: outstanding,
          isCreditEnabled: isCreditEnabled,
          lastOrderDate: cur.lastOrderDate ?? dStr,
        );
      }
    }
    final customersList = customerMap.values.toList()..sort((a, b) => b.totalPurchased.compareTo(a.totalPurchased));

    return _ReportData(
      shops: shops,
      selectedShopId: activeShopId,
      shopName: shopName,
      dateRange: range,
      preset: _selectedPreset,
      kpis: kpis,
      salesTrend: salesTrend,
      statusBreakdown: statusBreakdown,
      paymentBreakdown: paymentBreakdown,
      dynamicPriceSummary: dynamicPriceSummary,
      deliveryPerformance: deliveryPerformance,
      topProducts: topProducts,
      categoryPerformance: categoryPerformance,
      orders: ordersList,
      creditLedger: creditLedgerList,
      customers: customersList,
    );
  }

  void _exportCSV(_ReportData data) {
    final activeIndex = _tabController.index;
    String csv = '';
    String title = 'Sales_Report';

    if (activeIndex == 0 || activeIndex == 1) {
      title = 'Orders_Report';
      csv = 'Order ID,Customer,Phone,Date,Items Count,Items,Payment,Status,Total (INR)\n';
      for (final o in data.orders) {
        final cleanSummary = '"${o.itemsSummary.replaceAll('"', '""')}"';
        final cleanCustomer = '"${o.customerName.replaceAll('"', '""')}"';
        csv += '${o.orderNumber},$cleanCustomer,${o.customerPhone},${o.date},${o.itemsCount},$cleanSummary,${o.paymentType},${o.status},${o.total}\n';
      }
    } else if (activeIndex == 2) {
      title = 'Products_Report';
      csv = 'Product Name,Category,Quantity Sold,Orders Count,Total Sales (INR),Average Price (INR)\n';
      for (final p in data.topProducts) {
        final cleanName = '"${p.name.replaceAll('"', '""')}"';
        csv += '$cleanName,${p.categoryName},${p.quantitySold},${p.ordersCount},${p.totalSales},${p.avgPrice}\n';
      }
    } else if (activeIndex == 3) {
      title = 'Payments_Credit_Report';
      csv = 'Customer,Phone,Credit Limit,Used Amount,Available Credit,Status,Last Used\n';
      for (final c in data.creditLedger) {
        csv += '"${c.name}",${c.phone},${c.creditLimit ?? 'No Limit'},${c.usedAmount},${c.availableCredit},${c.isBlocked ? 'Blocked' : 'Active'},${c.lastUsedAt ?? 'Never'}\n';
      }
    } else if (activeIndex == 4) {
      title = 'Customers_Report';
      csv = 'Customer Name,Phone,Total Orders,Total Purchased (INR),Credit Outstanding (INR),Last Order\n';
      for (final c in data.customers) {
        csv += '"${c.name}",${c.phone},${c.totalOrders},${c.totalPurchased},${c.creditOutstanding},${c.lastOrderDate ?? 'Never'}\n';
      }
    }

    final bytes = utf8.encode(csv);
    final base64Str = base64Encode(bytes);
    final uri = 'data:text/csv;charset=utf-8;base64,$base64Str';
    launchUrl(Uri.parse(uri));

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Exported $title successfully!'),
        backgroundColor: const Color(0xFF10B981),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  bool get isDark => ThemeService.instance.isDarkMode;

  Color get bgColor => isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9);
  Color get cardBg => isDark ? const Color(0xFF1E293B) : Colors.white;
  Color get cardBorder => isDark ? const Color(0x1AFFFFFF) : const Color(0xFFE2E8F0);
  Color get headerBg => isDark ? const Color(0xFF1E293B) : Colors.white;
  Color get chipBg => isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
  Color get textPrimary => isDark ? Colors.white : const Color(0xFF0F172A);
  Color get textSecondary => isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
  Color get textMuted => isDark ? Colors.white38 : const Color(0xFF94A3B8);
  Color get dividerColor => isDark ? const Color(0x1AFFFFFF) : const Color(0xFFE2E8F0);
  Color get inputBg => isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9);
  Color get progressTrackBg => isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);

  void _pickCustomDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2023),
      lastDate: now,
      initialDateRange: _customDateRange ?? DateTimeRange(
        start: DateTime(now.year, now.month, 1),
        end: now,
      ),
      builder: (context, child) {
        return Theme(
          data: isDark
              ? ThemeData.dark().copyWith(
                  colorScheme: const ColorScheme.dark(
                    primary: Color(0xFF3B82F6),
                    onPrimary: Colors.white,
                    surface: Color(0xFF1E293B),
                    onSurface: Colors.white,
                  ),
                )
              : ThemeData.light().copyWith(
                  colorScheme: const ColorScheme.light(
                    primary: Color(0xFF3B82F6),
                    onPrimary: Colors.white,
                    surface: Colors.white,
                    onSurface: Color(0xFF0F172A),
                  ),
                ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedPreset = 'custom';
        _customDateRange = picked;
      });
      _reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = _VendorReportsL10n(context);

    return ListenableBuilder(
      listenable: ThemeService.instance,
      builder: (context, _) {
        return Scaffold(
          backgroundColor: bgColor,
          drawer: const VendorDrawer(currentRoute: '/vendor/reports'),
          appBar: AppBar(
            backgroundColor: headerBg,
            elevation: 0,
            foregroundColor: textPrimary,
            leading: Builder(
              builder: (context) => IconButton(
                icon: HugeIcon(
                  icon: HugeIcons.strokeRoundedMenu01,
                  color: textPrimary,
                  size: 22,
                ),
                onPressed: () => Scaffold.of(context).openDrawer(),
              ),
            ),
            title: Text(
              l10n.screenTitle,
              style: TextStyle(
                color: textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.3,
              ),
            ),
            actions: [
              IconButton(
                tooltip: isDark ? 'Light Mode' : 'Dark Mode',
                icon: Icon(
                  isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                  color: isDark ? const Color(0xFFFBBF24) : const Color(0xFF64748B),
                  size: 20,
                ),
                onPressed: () {
                  ThemeService.instance.toggleTheme();
                },
              ),
              IconButton(
                tooltip: l10n.refresh,
                icon: HugeIcon(
                  icon: HugeIcons.strokeRoundedRefresh,
                  color: textSecondary,
                  size: 20,
                ),
                onPressed: _reload,
              ),
              FutureBuilder<_ReportData>(
                future: _future,
                builder: (context, snapshot) {
                  if (!snapshot.hasData) return const SizedBox.shrink();
                  return IconButton(
                    tooltip: l10n.exportCsv,
                    icon: const HugeIcon(
                      icon: HugeIcons.strokeRoundedDownload01,
                      color: Color(0xFF38BDF8),
                      size: 20,
                    ),
                    onPressed: () => _exportCSV(snapshot.data!),
                  );
                },
              ),
              const SizedBox(width: 8),
            ],
            bottom: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              indicatorColor: const Color(0xFF3B82F6),
              indicatorWeight: 3,
              labelColor: const Color(0xFF3B82F6),
              unselectedLabelColor: textSecondary,
              labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
              unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              tabs: [
                Tab(icon: const Icon(Icons.dashboard_outlined, size: 18), text: l10n.tabOverview),
                Tab(icon: const Icon(Icons.shopping_bag_outlined, size: 18), text: l10n.tabOrders),
                Tab(icon: const Icon(Icons.inventory_2_outlined, size: 18), text: l10n.tabProducts),
                Tab(icon: const Icon(Icons.credit_card_outlined, size: 18), text: l10n.tabPayments),
                Tab(icon: const Icon(Icons.people_outline, size: 18), text: l10n.tabCustomers),
              ],
            ),
          ),
          body: FutureBuilder<_ReportData>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(
                  child: CircularProgressIndicator(color: Color(0xFF3B82F6)),
                );
              }

              if (snapshot.hasError) {
                return Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const HugeIcon(
                          icon: HugeIcons.strokeRoundedAlertCircle,
                          color: Color(0xFFEF4444),
                          size: 48,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          l10n.failedToLoad,
                          style: TextStyle(color: textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          snapshot.error.toString(),
                          textAlign: TextAlign.center,
                          style: TextStyle(color: textSecondary, fontSize: 13),
                        ),
                        const SizedBox(height: 20),
                        ElevatedButton.icon(
                          onPressed: _reload,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF3B82F6),
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          icon: const Icon(Icons.refresh, color: Colors.white, size: 18),
                          label: Text(l10n.tryAgain, style: const TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                  ),
                );
              }

              final data = snapshot.data!;
              return Column(
                children: [
                  // Top Shop & Date Filter Bar
                  _buildFilterHeader(data, l10n),

                  // Tab Views
                  Expanded(
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildOverviewTab(data, l10n),
                        _buildOrdersTab(data, l10n),
                        _buildProductsTab(data, l10n),
                        _buildPaymentsTab(data, l10n),
                        _buildCustomersTab(data, l10n),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  // ─── Header Filter Controls ──────────────────────────────────────────────

  Widget _buildFilterHeader(_ReportData data, _VendorReportsL10n l10n) {
    return Container(
      color: headerBg,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Multi Shop Dropdown & Live Preset Chips
          Row(
            children: [
              if (data.shops.length > 1) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: chipBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: cardBorder),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedShopId,
                      dropdownColor: cardBg,
                      isDense: true,
                      style: TextStyle(color: textPrimary, fontSize: 12, fontWeight: FontWeight.w700),
                      icon: Icon(Icons.arrow_drop_down, color: textSecondary, size: 18),
                      items: data.shops.map((s) {
                        return DropdownMenuItem(
                          value: s.id,
                          child: Text(s.name),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null && val != _selectedShopId) {
                          setState(() => _selectedShopId = val);
                          _reload();
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],

              // Date Range summary
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildPresetChip('today', l10n.filterToday),
                      _buildPresetChip('yesterday', l10n.filterYesterday),
                      _buildPresetChip('last_7_days', l10n.filterLast7Days),
                      _buildPresetChip('this_month', l10n.filterThisMonth),
                      _buildPresetChip('last_month', l10n.filterLastMonth),
                      _buildCustomDateChip(l10n),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPresetChip(String key, String label) {
    final isSelected = _selectedPreset == key;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        label: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : textSecondary,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        selected: isSelected,
        onSelected: (selected) {
          if (selected) {
            setState(() {
              _selectedPreset = key;
              _customDateRange = null;
            });
            _reload();
          }
        },
        backgroundColor: chipBg,
        selectedColor: const Color(0xFF3B82F6),
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        side: BorderSide(color: isSelected ? const Color(0xFF60A5FA) : Colors.transparent),
        showCheckmark: false,
      ),
    );
  }

  Widget _buildCustomDateChip(_VendorReportsL10n l10n) {
    final isCustom = _selectedPreset == 'custom';
    String label = l10n.filterCustom;
    if (isCustom && _customDateRange != null) {
      final df = DateFormat('d MMM');
      label = '${df.format(_customDateRange!.start)} - ${df.format(_customDateRange!.end)}';
    }

    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ActionChip(
        avatar: Icon(Icons.calendar_today, size: 12, color: isCustom ? Colors.white : textSecondary),
        label: Text(
          label,
          style: TextStyle(
            color: isCustom ? Colors.white : textSecondary,
            fontSize: 11,
            fontWeight: isCustom ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
        backgroundColor: isCustom ? const Color(0xFF3B82F6) : chipBg,
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        side: BorderSide(color: isCustom ? const Color(0xFF60A5FA) : Colors.transparent),
        onPressed: _pickCustomDateRange,
      ),
    );
  }
  // ─── TAB 1: OVERVIEW ───────────────────────────────────────────────────────

  Widget _buildOverviewTab(_ReportData data, _VendorReportsL10n l10n) {
    final k = data.kpis;

    return RefreshIndicator(
      onRefresh: () async => _reload(),
      color: const Color(0xFF3B82F6),
      backgroundColor: cardBg,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 8 Core KPI Cards in 2x4 Grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.35,
            children: [
              _buildKpiCard(
                title: l10n.kpiTotalSales,
                value: _inrFormat.format(k.totalSales),
                subtext: k.salesChangePercent != null
                    ? '${k.salesChangePercent! >= 0 ? '+' : ''}${k.salesChangePercent}% ${l10n.vsPrevPeriod}'
                    : l10n.nonCancelledOrders,
                trend: k.salesChangePercent,
                icon: HugeIcons.strokeRoundedAnalytics01,
                iconColor: const Color(0xFF34D399),
                bgColor: const Color(0x1A34D399),
              ),
              _buildKpiCard(
                title: l10n.kpiOrders,
                value: k.totalOrders.toString(),
                subtext: k.ordersChangePercent != null
                    ? '${k.ordersChangePercent! >= 0 ? '+' : ''}${k.ordersChangePercent}% ${l10n.vsPrevPeriod}'
                    : l10n.totalCreatedOrders,
                trend: k.ordersChangePercent,
                icon: HugeIcons.strokeRoundedShoppingBag02,
                iconColor: const Color(0xFF60A5FA),
                bgColor: const Color(0x1A60A5FA),
              ),
              _buildKpiCard(
                title: l10n.kpiItemsSold,
                value: k.itemsSold.toStringAsFixed(k.itemsSold.truncateToDouble() == k.itemsSold ? 0 : 1),
                subtext: l10n.unitsPacked,
                icon: HugeIcons.strokeRoundedPackage,
                iconColor: const Color(0xFFC084FC),
                bgColor: const Color(0x1AC084FC),
              ),
              _buildKpiCard(
                title: l10n.kpiAvgOrder,
                value: _inrFormat.format(k.avgOrderValue),
                subtext: l10n.kpiAvgOrder,
                icon: HugeIcons.strokeRoundedCalculator,
                iconColor: const Color(0xFF38BDF8),
                bgColor: const Color(0x1A38BDF8),
              ),
              _buildKpiCard(
                title: l10n.kpiPaid,
                value: _inrFormat.format(k.paidAmount),
                subtext: l10n.codPlusRepayments,
                icon: HugeIcons.strokeRoundedWallet01,
                iconColor: const Color(0xFF10B981),
                bgColor: const Color(0x1A10B981),
              ),
              _buildKpiCard(
                title: l10n.kpiCreditSales,
                value: _inrFormat.format(k.creditSales),
                subtext: l10n.ordersOnCredit,
                icon: HugeIcons.strokeRoundedCreditCard,
                iconColor: const Color(0xFFFBBF24),
                bgColor: const Color(0x1AFBBF24),
              ),
              _buildKpiCard(
                title: l10n.kpiOutstanding,
                value: _inrFormat.format(k.outstandingCredit),
                subtext: l10n.liveUnpaidBalance,
                icon: HugeIcons.strokeRoundedAlertCircle,
                iconColor: const Color(0xFFF87171),
                bgColor: const Color(0x1AF87171),
              ),
              _buildKpiCard(
                title: l10n.kpiCancellation,
                value: '${k.cancellationRate}%',
                subtext: '${k.cancelledOrdersCount} ${l10n.cancelledOrders}',
                icon: HugeIcons.strokeRoundedCancel01,
                iconColor: const Color(0xFFF43F5E),
                bgColor: const Color(0x1AF43F5E),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Daily Sales Trend Visualizer
          _buildSalesTrendCard(data.salesTrend, l10n),

          const SizedBox(height: 20),

          // Order Status Breakdown
          _buildStatusBreakdownCard(data, l10n),

          const SizedBox(height: 20),

          // Payment Breakdown (COD vs Credit)
          _buildPaymentBreakdownCard(data, l10n),

          const SizedBox(height: 20),

          // Dynamic Price Adjustments Card
          _buildDynamicPriceCard(data.dynamicPriceSummary, l10n),

          const SizedBox(height: 20),

          // Delivery Performance Card
          _buildDeliveryPerformanceCard(data.deliveryPerformance, l10n),

          const SizedBox(height: 20),

          // Top 5 Products Preview
          _buildTopProductsCard(data.topProducts, l10n),

          const SizedBox(height: 20),

          // Category Share Preview
          _buildCategoryPerformanceCard(data.categoryPerformance, l10n),

          const SizedBox(height: 30),
        ],
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required String subtext,
    double? trend,
    required List<List<dynamic>> icon,
    required Color iconColor,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder),
        boxShadow: isDark
            ? null
            : [
                const BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 2),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(color: textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
              ),
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
                child: Center(
                  child: HugeIcon(icon: icon, color: iconColor, size: 14),
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FittedBox(
                fit: BoxFit.scaleDown,
                child: Text(
                  value,
                  style: TextStyle(color: textPrimary, fontSize: 18, fontWeight: FontWeight.w900),
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  if (trend != null) ...[
                    Icon(
                      trend >= 0 ? Icons.trending_up : Icons.trending_down,
                      color: trend >= 0 ? const Color(0xFF34D399) : const Color(0xFFF87171),
                      size: 12,
                    ),
                    const SizedBox(width: 2),
                  ],
                  Expanded(
                    child: Text(
                      subtext,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: trend != null
                            ? (trend >= 0 ? const Color(0xFF34D399) : const Color(0xFFF87171))
                            : textMuted,
                        fontSize: 10,
                        fontWeight: trend != null ? FontWeight.w700 : FontWeight.normal,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSalesTrendCard(List<_SalesTrendPoint> trend, _VendorReportsL10n l10n) {
    final maxSale = trend.isEmpty
        ? 1.0
        : trend.map((e) => e.sales).reduce((a, b) => a > b ? a : b).clamp(1.0, double.infinity);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder),
        boxShadow: isDark
            ? null
            : [
                const BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 2),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const HugeIcon(
                    icon: HugeIcons.strokeRoundedAnalytics01,
                    color: Color(0xFF60A5FA),
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    l10n.salesTrend,
                    style: TextStyle(color: textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
                  ),
                ],
              ),
              Text(
                '${trend.length} Days',
                style: TextStyle(color: textMuted, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (trend.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(l10n.noProductsSold, style: TextStyle(color: textMuted, fontSize: 12)),
              ),
            )
          else ...[
            SizedBox(
              height: 140,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: trend.length,
                separatorBuilder: (context, index) => const SizedBox(width: 10),
                itemBuilder: (context, index) {
                  final pt = trend[index];
                  final heightPct = (pt.sales / maxSale).clamp(0.08, 1.0);
                  final isPeak = pt.sales == maxSale && maxSale > 0;

                  return Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        _inrFormat.format(pt.sales),
                        style: TextStyle(
                          color: isPeak ? const Color(0xFF34D399) : textSecondary,
                          fontSize: 9,
                          fontWeight: isPeak ? FontWeight.w800 : FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        width: 24,
                        height: 80 * heightPct,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: isPeak
                                ? [const Color(0xFF34D399), const Color(0xFF059669)]
                                : [const Color(0xFF60A5FA), const Color(0xFF2563EB)],
                          ),
                          borderRadius: BorderRadius.circular(6),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        pt.label,
                        style: TextStyle(color: textSecondary, fontSize: 10),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBreakdownCard(_ReportData data, _VendorReportsL10n l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder),
        boxShadow: isDark
            ? null
            : [
                const BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 2),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.ordersByStatus,
                style: TextStyle(color: textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
              ),
              TextButton(
                onPressed: () {
                  _ordersStatusFilter = 'all';
                  _tabController.animateTo(1);
                },
                child: Text(l10n.viewAllOrders, style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...data.statusBreakdown.map((s) {
            final count = s.count;
            final percent = data.kpis.totalOrders > 0 ? (count / data.kpis.totalOrders) * 100 : 0.0;
            Color color = const Color(0xFF60A5FA);
            if (s.status == 'delivered') color = const Color(0xFF34D399);
            if (s.status == 'cancelled') color = const Color(0xFFF87171);
            if (s.status == 'pending') color = const Color(0xFFFBBF24);
            if (s.status == 'packing') color = const Color(0xFFC084FC);

            return InkWell(
              onTap: () {
                _ordersStatusFilter = s.status;
                _tabController.animateTo(1);
              },
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              s.status.toUpperCase(),
                              style: TextStyle(color: textPrimary, fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                        Text(
                          '$count orders (${_inrFormat.format(s.amount)})',
                          style: TextStyle(color: textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(
                      value: percent / 100,
                      backgroundColor: progressTrackBg,
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                      minHeight: 4,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildPaymentBreakdownCard(_ReportData data, _VendorReportsL10n l10n) {
    final pb = data.paymentBreakdown;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder),
        boxShadow: isDark
            ? null
            : [
                const BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 2),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.paymentBreakdown,
                style: TextStyle(color: textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
              ),
              TextButton(
                onPressed: () => _tabController.animateTo(3),
                child: Text(l10n.paymentsLedger, style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              // COD
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0x1510B981),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0x3310B981)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const HugeIcon(
                            icon: HugeIcons.strokeRoundedWallet01,
                            color: Color(0xFF34D399),
                            size: 14,
                          ),
                          const SizedBox(width: 6),
                          Text(l10n.cod, style: const TextStyle(color: Color(0xFF34D399), fontSize: 11, fontWeight: FontWeight.w800)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _inrFormat.format(pb.codAmount),
                        style: TextStyle(color: textPrimary, fontSize: 16, fontWeight: FontWeight.w900),
                      ),
                      Text('${pb.codCount} orders', style: TextStyle(color: textSecondary, fontSize: 11)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Credit
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0x15FBBF24),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0x33FBBF24)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const HugeIcon(
                            icon: HugeIcons.strokeRoundedCreditCard,
                            color: Color(0xFFFBBF24),
                            size: 14,
                          ),
                          const SizedBox(width: 6),
                          Text(l10n.creditPayLater, style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 11, fontWeight: FontWeight.w800)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _inrFormat.format(pb.creditAmount),
                        style: TextStyle(color: textPrimary, fontSize: 16, fontWeight: FontWeight.w900),
                      ),
                      Text('${pb.creditCount} orders', style: TextStyle(color: textSecondary, fontSize: 11)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: chipBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.liveOutstandingCredit, style: TextStyle(color: textSecondary, fontSize: 11)),
                    Text(
                      _inrFormat.format(data.kpis.outstandingCredit),
                      style: const TextStyle(color: Color(0xFFF87171), fontSize: 14, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                ElevatedButton(
                  onPressed: () => _tabController.animateTo(4),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    minimumSize: Size.zero,
                  ),
                  child: Text(l10n.viewCreditCustomers, style: const TextStyle(color: Colors.white, fontSize: 11)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDynamicPriceCard(_DynamicPriceSummary dp, _VendorReportsL10n l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder),
        boxShadow: isDark
            ? null
            : [
                const BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 2),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.scale,
                color: Color(0xFFFBBF24),
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                l10n.dynamicPriceAdjustments,
                style: TextStyle(color: textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            l10n.dynamicPriceSubtext,
            style: TextStyle(color: textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _buildSmallStatBox(l10n.adjustedOrders, dp.adjustedOrdersCount.toString()),
              const SizedBox(width: 8),
              _buildSmallStatBox(l10n.estimated, _inrFormat.format(dp.totalEstimated)),
              const SizedBox(width: 8),
              _buildSmallStatBox(l10n.finalPacked, _inrFormat.format(dp.totalFinal), valueColor: const Color(0xFF10B981)),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0x1AFBBF24),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${l10n.netDifference}:', style: TextStyle(color: textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
                Text(
                  '${dp.difference >= 0 ? '+' : ''}${_inrFormat.format(dp.difference)} (${dp.differencePercent}%)',
                  style: TextStyle(
                    color: dp.difference >= 0 ? const Color(0xFF34D399) : const Color(0xFFF87171),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDeliveryPerformanceCard(_DeliveryPerformance dp, _VendorReportsL10n l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder),
        boxShadow: isDark
            ? null
            : [
                const BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 2),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const HugeIcon(
                icon: HugeIcons.strokeRoundedDeliveryTruck01,
                color: Color(0xFF60A5FA),
                size: 18,
              ),
              const SizedBox(width: 8),
              Text(
                l10n.deliveryPerformance,
                style: TextStyle(color: textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            l10n.deliverySubtext,
            style: TextStyle(color: textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _buildSmallStatBox(l10n.morning, dp.morningCount.toString(), icon: Icons.wb_sunny_outlined, iconColor: const Color(0xFFFBBF24)),
              const SizedBox(width: 8),
              _buildSmallStatBox(l10n.evening, dp.eveningCount.toString(), icon: Icons.nightlight_outlined, iconColor: const Color(0xFFC084FC)),
              const SizedBox(width: 8),
              _buildSmallStatBox(l10n.delivered, dp.deliveredCount.toString(), valueColor: const Color(0xFF34D399)),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: chipBg, borderRadius: BorderRadius.circular(8)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${l10n.pendingDispatch}:', style: TextStyle(color: textSecondary, fontSize: 12)),
                Text('${dp.pendingDeliveriesCount} orders', style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 12, fontWeight: FontWeight.w800)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSmallStatBox(String label, String value, {Color? valueColor, IconData? icon, Color? iconColor}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(color: chipBg, borderRadius: BorderRadius.circular(10)),
        child: Column(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: iconColor),
              const SizedBox(height: 2),
            ],
            Text(label, style: TextStyle(color: textSecondary, fontSize: 10)),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: TextStyle(color: valueColor ?? textPrimary, fontSize: 14, fontWeight: FontWeight.w800),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopProductsCard(List<_TopProductItem> products, _VendorReportsL10n l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder),
        boxShadow: isDark
            ? null
            : [
                const BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 2),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.topSellingProducts,
                style: TextStyle(color: textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
              ),
              TextButton(
                onPressed: () => _tabController.animateTo(2),
                child: Text(l10n.allProducts, style: const TextStyle(color: Color(0xFF3B82F6), fontSize: 12, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (products.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(child: Text(l10n.noProductsSold, style: TextStyle(color: textMuted, fontSize: 12))),
            )
          else ...[
            ...products.take(5).map((p) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: chipBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: p.imageUrl != null
                          ? Image.network(p.imageUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Icon(Icons.inventory_2, color: textMuted, size: 20))
                          : Icon(Icons.inventory_2, color: textMuted, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            p.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: textPrimary, fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                          Text(
                            '${p.categoryName} • ${p.quantitySold} sold',
                            style: TextStyle(color: textSecondary, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      _inrFormat.format(p.totalSales),
                      style: const TextStyle(color: Color(0xFF34D399), fontSize: 13, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildCategoryPerformanceCard(List<_CategoryPerformanceItem> categories, _VendorReportsL10n l10n) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder),
        boxShadow: isDark
            ? null
            : [
                const BoxShadow(
                  color: Color(0x06000000),
                  blurRadius: 10,
                  offset: Offset(0, 2),
                )
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${l10n.categoryPerformance} (${l10n.byRevenueShare})',
            style: TextStyle(color: textPrimary, fontSize: 15, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          if (categories.isEmpty)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Center(child: Text(l10n.noCategoryData, style: TextStyle(color: textMuted, fontSize: 12))),
            )
          else ...[
            ...categories.take(5).map((c) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(c.name, style: TextStyle(color: textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
                        Text('${_inrFormat.format(c.totalSales)} (${c.percentage}%)', style: TextStyle(color: textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    LinearProgressIndicator(
                      value: (c.percentage / 100).clamp(0.0, 1.0),
                      backgroundColor: progressTrackBg,
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF3B82F6)),
                      minHeight: 4,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ],
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
  // ─── TAB 2: ORDERS ─────────────────────────────────────────────────────────

  Widget _buildOrdersTab(_ReportData data, _VendorReportsL10n l10n) {
    final filtered = data.orders.where((o) {
      if (_ordersStatusFilter != 'all' && o.status != _ordersStatusFilter) return false;
      if (_ordersPaymentFilter != 'all' && o.paymentType != _ordersPaymentFilter) return false;
      if (_ordersSearchCtrl.text.trim().isNotEmpty) {
        final q = _ordersSearchCtrl.text.toLowerCase();
        final matchNumber = o.orderNumber.toLowerCase().contains(q);
        final matchCust = o.customerName.toLowerCase().contains(q);
        final matchPhone = o.customerPhone.contains(q);
        if (!matchNumber && !matchCust && !matchPhone) return false;
      }
      return true;
    }).toList();

    final filteredSum = filtered.where((o) => o.status != 'cancelled').fold<double>(0, (sum, o) => sum + o.total);

    return Column(
      children: [
        // Search & Filters Header
        Container(
          color: headerBg,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Column(
            children: [
              TextField(
                controller: _ordersSearchCtrl,
                style: TextStyle(color: textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  hintText: l10n.searchOrders,
                  hintStyle: TextStyle(color: textMuted, fontSize: 13),
                  prefixIcon: Icon(Icons.search, color: textMuted, size: 18),
                  filled: true,
                  fillColor: inputBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  isDense: true,
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  // Status Filter
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                      decoration: BoxDecoration(color: chipBg, borderRadius: BorderRadius.circular(8)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _ordersStatusFilter,
                          dropdownColor: cardBg,
                          isExpanded: true,
                          isDense: true,
                          style: TextStyle(color: textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
                          items: [
                            DropdownMenuItem(value: 'all', child: Text(l10n.allStatuses)),
                            DropdownMenuItem(value: 'pending', child: Text(l10n.isMl ? 'പെൻഡിങ്' : 'Pending')),
                            DropdownMenuItem(value: 'delivering', child: Text(l10n.isMl ? 'ഡെലിവറിക്ക് പോയത്' : 'Out for Delivery')),
                            DropdownMenuItem(value: 'packing', child: Text(l10n.isMl ? 'പൂർത്തിയായത്' : 'Txn Completed')),
                            DropdownMenuItem(value: 'delivered', child: Text(l10n.isMl ? 'ഡെലിവറി ചെയ്തവ' : 'Delivered')),
                            DropdownMenuItem(value: 'cancelled', child: Text(l10n.isMl ? 'റദ്ദാക്കിയവ' : 'Cancelled')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _ordersStatusFilter = val);
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Payment Filter
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                      decoration: BoxDecoration(color: chipBg, borderRadius: BorderRadius.circular(8)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _ordersPaymentFilter,
                          dropdownColor: cardBg,
                          isExpanded: true,
                          isDense: true,
                          style: TextStyle(color: textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
                          items: [
                            DropdownMenuItem(value: 'all', child: Text(l10n.allPayments)),
                            DropdownMenuItem(value: 'cod', child: Text(l10n.cod)),
                            DropdownMenuItem(value: 'credit', child: Text(l10n.creditPayLater)),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _ordersPaymentFilter = val);
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Count & Total summary
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: bgColor,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${l10n.showingOrders}: ${filtered.length}', style: TextStyle(color: textSecondary, fontSize: 12)),
              Text('${l10n.nonCancelledTotal}: ${_inrFormat.format(filteredSum)}', style: const TextStyle(color: Color(0xFF34D399), fontSize: 12, fontWeight: FontWeight.w800)),
            ],
          ),
        ),

        // Orders List
        Expanded(
          child: filtered.isEmpty
              ? Center(child: Text(l10n.noOrdersFound, style: TextStyle(color: textMuted)))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final o = filtered[index];
                    return _buildOrderListItem(o, l10n);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildOrderListItem(_ReportOrderItem o, _VendorReportsL10n l10n) {
    Color statusColor = const Color(0xFF60A5FA);
    if (o.status == 'delivered') statusColor = const Color(0xFF34D399);
    if (o.status == 'cancelled') statusColor = const Color(0xFFF87171);
    if (o.status == 'pending') statusColor = const Color(0xFFFBBF24);
    if (o.status == 'packing') statusColor = const Color(0xFFC084FC);

    return InkWell(
      onTap: () => context.push('/vendor/orders/${o.id}'),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: cardBorder),
          boxShadow: isDark
              ? null
              : [
                  const BoxShadow(
                    color: Color(0x06000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  )
                ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      '#${o.orderNumber}',
                      style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        o.status.toUpperCase(),
                        style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ],
                ),
                Text(
                  _inrFormat.format(o.total),
                  style: const TextStyle(color: Color(0xFF34D399), fontSize: 15, fontWeight: FontWeight.w900),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.person_outline, size: 14, color: textSecondary),
                const SizedBox(width: 4),
                Text(o.customerName, style: TextStyle(color: textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
                if (o.customerPhone.isNotEmpty) ...[
                  const SizedBox(width: 6),
                  Text('(${o.customerPhone})', style: TextStyle(color: textMuted, fontSize: 11)),
                ],
              ],
            ),
            const SizedBox(height: 4),
            Text(
              o.itemsSummary,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: o.paymentType == 'credit' ? const Color(0x22FBBF24) : const Color(0x2210B981),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        o.paymentType == 'credit' ? 'CREDIT' : 'COD',
                        style: TextStyle(
                          color: o.paymentType == 'credit' ? const Color(0xFFFBBF24) : const Color(0xFF34D399),
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    if (o.deliverySlot != null) ...[
                      const SizedBox(width: 8),
                      Text(o.deliverySlot!, style: TextStyle(color: textMuted, fontSize: 11)),
                    ],
                  ],
                ),
                Text(o.date, style: TextStyle(color: textMuted, fontSize: 10)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // ─── TAB 3: PRODUCTS ───────────────────────────────────────────────────────

  Widget _buildProductsTab(_ReportData data, _VendorReportsL10n l10n) {
    final filtered = data.topProducts.where((p) {
      if (_productsCategoryFilter != 'all' && p.categoryName != _productsCategoryFilter) return false;
      if (_productsSearchCtrl.text.trim().isNotEmpty) {
        if (!p.name.toLowerCase().contains(_productsSearchCtrl.text.toLowerCase())) return false;
      }
      return true;
    }).toList();

    if (_productsSortBy == 'quantity') {
      filtered.sort((a, b) => b.quantitySold.compareTo(a.quantitySold));
    } else if (_productsSortBy == 'orders') {
      filtered.sort((a, b) => b.ordersCount.compareTo(a.ordersCount));
    } else {
      filtered.sort((a, b) => b.totalSales.compareTo(a.totalSales));
    }

    final categoriesList = ['all', ...data.categoryPerformance.map((c) => c.name)];

    return Column(
      children: [
        Container(
          color: headerBg,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Column(
            children: [
              TextField(
                controller: _productsSearchCtrl,
                style: TextStyle(color: textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  hintText: l10n.searchProducts,
                  hintStyle: TextStyle(color: textMuted, fontSize: 13),
                  prefixIcon: Icon(Icons.search, color: textMuted, size: 18),
                  filled: true,
                  fillColor: inputBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  isDense: true,
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                      decoration: BoxDecoration(color: chipBg, borderRadius: BorderRadius.circular(8)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: categoriesList.contains(_productsCategoryFilter) ? _productsCategoryFilter : 'all',
                          dropdownColor: cardBg,
                          isExpanded: true,
                          isDense: true,
                          style: TextStyle(color: textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
                          items: categoriesList.map((c) {
                            return DropdownMenuItem(value: c, child: Text(c == 'all' ? l10n.allCategories : c));
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _productsCategoryFilter = val);
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                      decoration: BoxDecoration(color: chipBg, borderRadius: BorderRadius.circular(8)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _productsSortBy,
                          dropdownColor: cardBg,
                          isExpanded: true,
                          isDense: true,
                          style: TextStyle(color: textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
                          items: [
                            DropdownMenuItem(value: 'sales', child: Text(l10n.sortSales)),
                            DropdownMenuItem(value: 'quantity', child: Text(l10n.sortUnits)),
                            DropdownMenuItem(value: 'orders', child: Text(l10n.sortOrders)),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _productsSortBy = val);
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        Expanded(
          child: filtered.isEmpty
              ? Center(child: Text(l10n.noProductsFound, style: TextStyle(color: textMuted)))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final p = filtered[index];
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: cardBorder),
                        boxShadow: isDark
                            ? null
                            : [
                                const BoxShadow(
                                  color: Color(0x06000000),
                                  blurRadius: 8,
                                  offset: Offset(0, 2),
                                )
                              ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 46,
                            height: 46,
                            decoration: BoxDecoration(
                              color: chipBg,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: p.imageUrl != null
                                ? Image.network(p.imageUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Icon(Icons.inventory_2, color: textMuted, size: 24))
                                : Icon(Icons.inventory_2, color: textMuted, size: 24),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        p.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(color: textPrimary, fontSize: 13, fontWeight: FontWeight.w800),
                                      ),
                                    ),
                                    if (p.isDynamic)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                        decoration: BoxDecoration(color: const Color(0x22FBBF24), borderRadius: BorderRadius.circular(4)),
                                        child: const Text('DYNAMIC', style: TextStyle(color: Color(0xFFFBBF24), fontSize: 9, fontWeight: FontWeight.w800)),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${p.categoryName} • ${p.quantitySold} ${l10n.unitsPacked} (${p.ordersCount} ${l10n.orders})',
                                  style: TextStyle(color: textSecondary, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                _inrFormat.format(p.totalSales),
                                style: const TextStyle(color: Color(0xFF34D399), fontSize: 14, fontWeight: FontWeight.w900),
                              ),
                              Text(
                                '${l10n.kpiAvgOrder} ${_inrFormat.format(p.avgPrice)}',
                                style: TextStyle(color: textMuted, fontSize: 10),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // ─── TAB 4: PAYMENTS & CREDIT ──────────────────────────────────────────────

  Widget _buildPaymentsTab(_ReportData data, _VendorReportsL10n l10n) {
    final filtered = data.creditLedger.where((c) {
      if (_paymentsFilter == 'outstanding' && c.usedAmount <= 0) return false;
      if (_paymentsFilter == 'blocked' && !c.isBlocked) return false;
      if (_paymentsSearchCtrl.text.trim().isNotEmpty) {
        final q = _paymentsSearchCtrl.text.toLowerCase();
        if (!c.name.toLowerCase().contains(q) && !c.phone.contains(q)) return false;
      }
      return true;
    }).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // 3 Payment Summary Cards
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0x1510B981),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0x3310B981)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.paidCollected, style: const TextStyle(color: Color(0xFF34D399), fontSize: 10, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        _inrFormat.format(data.kpis.paidAmount),
                        style: TextStyle(color: textPrimary, fontSize: 16, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0x15FBBF24),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0x33FBBF24)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.creditSalesTitle, style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 10, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        _inrFormat.format(data.kpis.creditSales),
                        style: TextStyle(color: textPrimary, fontSize: 16, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0x15F87171),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0x33F87171)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.currentOutstanding, style: const TextStyle(color: Color(0xFFF87171), fontSize: 10, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        _inrFormat.format(data.kpis.outstandingCredit),
                        style: const TextStyle(color: Color(0xFFF87171), fontSize: 16, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 16),

        // Search and filter for credit customers
        TextField(
          controller: _paymentsSearchCtrl,
          style: TextStyle(color: textPrimary, fontSize: 13),
          decoration: InputDecoration(
            hintText: l10n.searchCustomer,
            hintStyle: TextStyle(color: textMuted, fontSize: 13),
            prefixIcon: Icon(Icons.search, color: textMuted, size: 18),
            filled: true,
            fillColor: cardBg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: cardBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: cardBorder),
            ),
            isDense: true,
          ),
          onChanged: (_) => setState(() {}),
        ),

        const SizedBox(height: 10),

        Row(
          children: [
            _buildPaymentFilterChip('all', l10n.allAccounts),
            const SizedBox(width: 8),
            _buildPaymentFilterChip('outstanding', l10n.withOutstanding),
            const SizedBox(width: 8),
            _buildPaymentFilterChip('blocked', l10n.blockedAccounts),
          ],
        ),

        const SizedBox(height: 16),

        // Credit Ledger List
        if (filtered.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32),
            child: Center(child: Text(l10n.noCreditFound, style: TextStyle(color: textMuted))),
          )
        else ...[
          ...filtered.map((c) {
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: cardBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: c.isBlocked ? const Color(0x33EF4444) : cardBorder),
                boxShadow: isDark
                    ? null
                    : [
                        const BoxShadow(
                          color: Color(0x06000000),
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        )
                      ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 14,
                            backgroundColor: chipBg,
                            child: Text(
                              c.name.isNotEmpty ? c.name[0].toUpperCase() : '?',
                              style: TextStyle(color: textPrimary, fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(c.name, style: TextStyle(color: textPrimary, fontSize: 13, fontWeight: FontWeight.w800)),
                              if (c.phone.isNotEmpty)
                                Text(c.phone, style: TextStyle(color: textMuted, fontSize: 11)),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: c.isBlocked ? const Color(0x22EF4444) : const Color(0x2210B981),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          c.isBlocked ? l10n.blocked.toUpperCase() : l10n.active.toUpperCase(),
                          style: TextStyle(
                            color: c.isBlocked ? const Color(0xFFF87171) : const Color(0xFF34D399),
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l10n.creditLimit, style: TextStyle(color: textMuted, fontSize: 10)),
                          Text(c.creditLimit != null ? _inrFormat.format(c.creditLimit!) : l10n.noLimit, style: TextStyle(color: textSecondary, fontSize: 12, fontWeight: FontWeight.w700)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(l10n.outstandingBalance, style: TextStyle(color: textMuted, fontSize: 10)),
                          Text(
                            _inrFormat.format(c.usedAmount),
                            style: TextStyle(color: c.usedAmount > 0 ? const Color(0xFFF87171) : textSecondary, fontSize: 12, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(l10n.availableCredit, style: TextStyle(color: textMuted, fontSize: 10)),
                          Text(
                            c.availableCredit == double.infinity ? (l10n.isMl ? 'പരിധിയില്ല' : 'Unlimited') : _inrFormat.format(c.availableCredit),
                            style: const TextStyle(color: Color(0xFF34D399), fontSize: 12, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ],
    );
  }

  Widget _buildPaymentFilterChip(String key, String label) {
    final isSelected = _paymentsFilter == key;
    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : textSecondary,
          fontSize: 11,
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) setState(() => _paymentsFilter = key);
      },
      backgroundColor: cardBg,
      selectedColor: const Color(0xFF3B82F6),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      side: BorderSide(color: isSelected ? const Color(0xFF60A5FA) : cardBorder),
      showCheckmark: false,
    );
  }

  // ─── TAB 5: CUSTOMERS ──────────────────────────────────────────────────────

  Widget _buildCustomersTab(_ReportData data, _VendorReportsL10n l10n) {
    final filtered = data.customers.where((c) {
      if (_customersFilter == 'outstanding' && c.creditOutstanding <= 0) return false;
      if (_customersFilter == 'credit' && !c.isCreditEnabled) return false;
      if (_customersSearchCtrl.text.trim().isNotEmpty) {
        final q = _customersSearchCtrl.text.toLowerCase();
        if (!c.name.toLowerCase().contains(q) && !c.phone.contains(q)) return false;
      }
      return true;
    }).toList();

    if (_customersSortBy == 'orders') {
      filtered.sort((a, b) => b.totalOrders.compareTo(a.totalOrders));
    } else if (_customersSortBy == 'outstanding') {
      filtered.sort((a, b) => b.creditOutstanding.compareTo(a.creditOutstanding));
    } else {
      filtered.sort((a, b) => b.totalPurchased.compareTo(a.totalPurchased));
    }

    return Column(
      children: [
        Container(
          color: headerBg,
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Column(
            children: [
              TextField(
                controller: _customersSearchCtrl,
                style: TextStyle(color: textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  hintText: l10n.searchCustomer,
                  hintStyle: TextStyle(color: textMuted, fontSize: 13),
                  prefixIcon: Icon(Icons.search, color: textMuted, size: 18),
                  filled: true,
                  fillColor: inputBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  isDense: true,
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                      decoration: BoxDecoration(color: chipBg, borderRadius: BorderRadius.circular(8)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _customersFilter,
                          dropdownColor: cardBg,
                          isExpanded: true,
                          isDense: true,
                          style: TextStyle(color: textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
                          items: [
                            DropdownMenuItem(value: 'all', child: Text(l10n.allCustomers)),
                            DropdownMenuItem(value: 'outstanding', child: Text(l10n.withOutstanding)),
                            DropdownMenuItem(value: 'credit', child: Text(l10n.creditAccounts)),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _customersFilter = val);
                          },
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                      decoration: BoxDecoration(color: chipBg, borderRadius: BorderRadius.circular(8)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _customersSortBy,
                          dropdownColor: cardBg,
                          isExpanded: true,
                          isDense: true,
                          style: TextStyle(color: textPrimary, fontSize: 11, fontWeight: FontWeight.w600),
                          items: [
                            DropdownMenuItem(value: 'purchased', child: Text(l10n.sortPurchased)),
                            DropdownMenuItem(value: 'orders', child: Text(l10n.sortCustomerOrders)),
                            DropdownMenuItem(value: 'outstanding', child: Text(l10n.sortCustomerOutstanding)),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _customersSortBy = val);
                          },
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        Expanded(
          child: filtered.isEmpty
              ? Center(child: Text(l10n.noCustomersFound, style: TextStyle(color: textMuted)))
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final c = filtered[index];
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: cardBorder),
                        boxShadow: isDark
                            ? null
                            : [
                                const BoxShadow(
                                  color: Color(0x06000000),
                                  blurRadius: 8,
                                  offset: Offset(0, 2),
                                )
                              ],
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 20,
                            backgroundColor: chipBg,
                            child: Text(
                              c.name.isNotEmpty ? c.name[0].toUpperCase() : '?',
                              style: TextStyle(color: textPrimary, fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(c.name, style: TextStyle(color: textPrimary, fontSize: 13, fontWeight: FontWeight.w800)),
                                if (c.phone.isNotEmpty)
                                  Text(c.phone, style: TextStyle(color: textMuted, fontSize: 11)),
                                const SizedBox(height: 2),
                                Text(
                                  '${c.totalOrders} ${l10n.orders} • ${l10n.lastActive}: ${c.lastOrderDate ?? 'N/A'}',
                                  style: TextStyle(color: textSecondary, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                _inrFormat.format(c.totalPurchased),
                                style: const TextStyle(color: Color(0xFF34D399), fontSize: 14, fontWeight: FontWeight.w900),
                              ),
                              if (c.creditOutstanding > 0)
                                Text(
                                  '${l10n.outstandingBalance}: ${_inrFormat.format(c.creditOutstanding)}',
                                  style: const TextStyle(color: Color(0xFFF87171), fontSize: 11, fontWeight: FontWeight.w700),
                                ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
