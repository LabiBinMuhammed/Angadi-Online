import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import 'package:village_market/core/supabase_client.dart';
import 'package:village_market/theme/theme_service.dart';
import '../../../models/models.dart';
import '../../../core/cart_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  PaymentType _paymentType = PaymentType.cod;
  bool _loading = false;
  List<dynamic> _addresses = [];
  dynamic _selectedAddress;

  // Form controllers for adding new address inline
  final _labelController = TextEditingController();
  final _line1Controller = TextEditingController();
  final _line2Controller = TextEditingController();
  final _landmarkController = TextEditingController();
  bool _saveToProfile = true;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  @override
  void dispose() {
    _labelController.dispose();
    _line1Controller.dispose();
    _line2Controller.dispose();
    _landmarkController.dispose();
    super.dispose();
  }

  void _clearForm() {
    _labelController.clear();
    _line1Controller.clear();
    _line2Controller.clear();
    _landmarkController.clear();
    _saveToProfile = true;
  }

  Future<void> _loadAddresses() async {
    try {
      final uid = supabase.auth.currentUser?.id;
      if (uid == null) return;
      final res = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', uid)
          .eq('is_active', true);
      if (mounted) {
        setState(() {
          _addresses = res as List<dynamic>;
          if (_addresses.isNotEmpty) {
            _selectedAddress = _addresses.firstWhere(
              (a) => a['is_default'] == true,
              orElse: () => _addresses.first as Map<String, dynamic>,
            );
          }
        });
      }
    } catch (e) {
      debugPrint('Error loading addresses in CheckoutScreen: $e');
    }
  }

  Widget _buildDialogTextField({
    required TextEditingController controller,
    required String label,
    required String placeholder,
    required Color kText,
    required Color kSubText,
    required Color kBorder,
    required Color kCardBg,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(color: kText, fontWeight: FontWeight.w700, fontSize: 12)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: TextStyle(color: kText, fontSize: 14),
          decoration: InputDecoration(
            hintText: placeholder,
            hintStyle: TextStyle(color: kSubText.withOpacity(0.6), fontSize: 13),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            filled: true,
            fillColor: kCardBg,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: kBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: kBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF4CD964), width: 1.5)),
          ),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  void _showAddressSelectionDialog() {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;
    final kCardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final kText = isDark ? Colors.white : const Color(0xFF1A1A1A);
    final kSubText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF555555);
    final kBorder = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final kInputBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC);

    bool isAddingAddress = false;
    String dialogError = '';
    bool isSavingAddress = false;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: kCardBg,
              surfaceTintColor: Colors.transparent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24), side: BorderSide(color: kBorder)),
              title: Text(
                isAddingAddress ? l10n.addNewAddressLabel : l10n.selectAddressLabel,
                style: TextStyle(color: kText, fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: -0.5),
              ),
              content: SizedBox(
                width: 480,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!isAddingAddress) ...[
                        // Add New Address Button
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: () {
                              setDialogState(() {
                                isAddingAddress = true;
                                dialogError = '';
                                _clearForm();
                              });
                            },
                            icon: const Icon(Icons.add, color: Color(0xFF4CD964), size: 18),
                            label: Text(l10n.addNewAddressLabel, style: const TextStyle(color: Color(0xFF4CD964), fontWeight: FontWeight.bold)),
                            style: OutlinedButton.styleFrom(
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              side: const BorderSide(color: Color(0xFF4CD964), width: 1),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        _addresses.isEmpty
                            ? Text(l10n.noAddressesFound, style: TextStyle(color: kSubText, fontSize: 14))
                            : ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _addresses.length,
                                itemBuilder: (context, index) {
                                  final addr = _addresses[index];
                                  final isSelected = _selectedAddress?['id'] == addr['id'] && _selectedAddress?['is_temp'] != true;
                                  return GestureDetector(
                                    onTap: () {
                                      setState(() => _selectedAddress = addr);
                                      Navigator.pop(context);
                                    },
                                    child: Container(
                                      margin: const EdgeInsets.only(bottom: 10),
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: isSelected 
                                            ? (isDark ? const Color(0xFF103629) : const Color(0xFFE8F9EC)) 
                                            : (isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC)),
                                        border: Border.all(
                                          color: isSelected ? const Color(0xFF4CD964) : kBorder,
                                          width: isSelected ? 1.5 : 1,
                                        ),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  '${addr['contact_name']} (${addr['contact_phone']})',
                                                  style: TextStyle(
                                                    color: kText,
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 14,
                                                  ),
                                                ),
                                                const SizedBox(height: 6),
                                                Text(
                                                  addr['address_line_1'] ?? '',
                                                  style: TextStyle(
                                                    color: kSubText,
                                                    fontSize: 12,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                                if (addr['address_line_2'] != null && addr['address_line_2'].toString().isNotEmpty) ...[
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    addr['address_line_2'],
                                                    style: TextStyle(
                                                      color: kSubText,
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w500,
                                                    ),
                                                  ),
                                                ],
                                                if (addr['landmark'] != null && addr['landmark'].toString().isNotEmpty) ...[
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    'Near ${addr['landmark']}',
                                                    style: TextStyle(
                                                      color: kSubText,
                                                      fontSize: 12,
                                                      fontStyle: FontStyle.italic,
                                                      fontWeight: FontWeight.w500,
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          ),
                                          if (isSelected)
                                            const Icon(Icons.check_circle, color: Color(0xFF4CD964), size: 22),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ] else ...[
                        // Address Form
                        if (dialogError.isNotEmpty) ...[
                          Text(
                            dialogError,
                            style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 12),
                        ],
                        _buildDialogTextField(
                          controller: _labelController,
                          label: l10n.addressLabel,
                          placeholder: l10n.addressLabelPlaceholder,
                          kText: kText,
                          kSubText: kSubText,
                          kBorder: kBorder,
                          kCardBg: kInputBg,
                        ),
                        _buildDialogTextField(
                          controller: _line1Controller,
                          label: l10n.addressLine1Label,
                          placeholder: l10n.addressLine1Placeholder,
                          kText: kText,
                          kSubText: kSubText,
                          kBorder: kBorder,
                          kCardBg: kInputBg,
                        ),
                        _buildDialogTextField(
                          controller: _line2Controller,
                          label: l10n.addressLine2Label,
                          placeholder: l10n.addressLine2Placeholder,
                          kText: kText,
                          kSubText: kSubText,
                          kBorder: kBorder,
                          kCardBg: kInputBg,
                        ),
                        _buildDialogTextField(
                          controller: _landmarkController,
                          label: l10n.landmarkLabel,
                          placeholder: l10n.landmarkPlaceholder,
                          kText: kText,
                          kSubText: kSubText,
                          kBorder: kBorder,
                          kCardBg: kInputBg,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Checkbox(
                              value: _saveToProfile,
                              activeColor: const Color(0xFF4CD964),
                              onChanged: (val) {
                                setDialogState(() {
                                  _saveToProfile = val ?? true;
                                });
                              },
                            ),
                            Expanded(
                              child: GestureDetector(
                                onTap: () {
                                  setDialogState(() {
                                    _saveToProfile = !_saveToProfile;
                                  });
                                },
                                child: Text(
                                  l10n.saveToAddressBook,
                                  style: TextStyle(color: kText, fontWeight: FontWeight.w600, fontSize: 13),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],
                    ],
                  ),
                ),
              ),
              actions: [
                if (!isAddingAddress)
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(l10n.closeButton, style: const TextStyle(color: Color(0xFF4CD964), fontWeight: FontWeight.bold, fontSize: 14)),
                  )
                else ...[
                  TextButton(
                    onPressed: isSavingAddress 
                        ? null 
                        : () {
                            setDialogState(() {
                              isAddingAddress = false;
                              dialogError = '';
                            });
                          },
                    child: Text(l10n.backButton, style: TextStyle(color: kSubText, fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                  TextButton(
                    onPressed: isSavingAddress
                        ? null
                        : () async {
                            final label = _labelController.text.trim();
                            final line1 = _line1Controller.text.trim();
                            final line2 = _line2Controller.text.trim();
                            final landmark = _landmarkController.text.trim();

                            if (label.isEmpty || line1.isEmpty) {
                              setDialogState(() {
                                dialogError = l10n.fillRequiredFieldsError;
                              });
                              return;
                            }

                            final user = supabase.auth.currentUser;
                            final name = user?.userMetadata?['full_name'] ?? user?.email?.split('@')[0] ?? 'Customer';
                            final phone = user?.phone ?? '0000000000';

                            if (_saveToProfile) {
                              setDialogState(() {
                                isSavingAddress = true;
                                dialogError = '';
                              });
                              try {
                                final uid = supabase.auth.currentUser?.id;
                                if (uid == null) throw Exception('Not logged in');

                                final res = await supabase.from('user_addresses').insert({
                                  'user_id': uid,
                                  'label': label,
                                  'contact_name': name,
                                  'contact_phone': phone,
                                  'address_line_1': line1,
                                  'address_line_2': line2.isNotEmpty ? line2 : null,
                                  'landmark': landmark.isNotEmpty ? landmark : null,
                                  'is_active': true,
                                  'is_default': _addresses.isEmpty,
                                }).select('*').single();

                                setState(() {
                                  _addresses.add(res);
                                  _selectedAddress = res;
                                });
                                Navigator.pop(context);
                              } catch (e) {
                                setDialogState(() {
                                  isSavingAddress = false;
                                  dialogError = 'Error: $e';
                                });
                              }
                            } else {
                              setState(() {
                                _selectedAddress = {
                                  'label': label,
                                  'contact_name': name,
                                  'contact_phone': phone,
                                  'address_line_1': line1,
                                  'address_line_2': line2.isNotEmpty ? line2 : null,
                                  'landmark': landmark.isNotEmpty ? landmark : null,
                                  'is_temp': true,
                                };
                              });
                              Navigator.pop(context);
                            }
                          },
                    child: isSavingAddress
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF4CD964)))
                        : Text(l10n.useAddressButton, style: const TextStyle(color: Color(0xFF4CD964), fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ],
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _placeOrder() async {
    final l10n = AppLocalizations.of(context)!;
    setState(() => _loading = true);
    try {
      final cart = CartService.instance;
      if (cart.items.isEmpty) throw Exception('Your cart is empty');

      final uid = supabase.auth.currentUser?.id;
      if (uid == null) throw Exception('You must be logged in to place an order');

      final activeAddress = _selectedAddress ?? {
        'contact_name': supabase.auth.currentUser?.email?.split('@')[0] ?? 'Customer',
        'contact_phone': '9999999999',
        'address_line_1': 'Village Main Street',
        'address_line_2': '',
        'landmark': ''
      };

      // 1. Fetch pending orders with payment_type is null
      final pendingOrdersRes = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', uid)
          .eq('status', 'pending')
          .isFilter('payment_type', null);

      final pendingOrders = pendingOrdersRes as List<dynamic>;
      if (pendingOrders.isEmpty) throw Exception('No pending cart found in database');

      final orderIds = pendingOrders.map((o) => o['id'] as String).toList();
      final firstOrderId = orderIds.first;

      // 2. Call transaction-safe checkout RPC
      await supabase.rpc('place_checkout_orders', params: {
        'p_order_ids': orderIds,
        'p_payment_type': _paymentType == PaymentType.cod ? 'cod' : 'credit',
        'p_delivery_date': cart.selectedDate.toIso8601String().split('T')[0],
        'p_delivery_slot': cart.selectedSlot,
        'p_contact_name': activeAddress['contact_name'],
        'p_contact_phone': activeAddress['contact_phone'],
        'p_address_line_1': activeAddress['address_line_1'],
        'p_address_line_2': activeAddress['address_line_2']?.toString().isNotEmpty == true ? activeAddress['address_line_2'] : null,
        'p_landmark': activeAddress['landmark']?.toString().isNotEmpty == true ? activeAddress['landmark'] : null,
        'p_label': activeAddress['label']?.toString().isNotEmpty == true ? activeAddress['label'] : 'Home',
      });

      if (mounted) {
        await CartService.instance.clearCart();
        context.pushReplacement('/cart/checkout/success?orderId=$firstOrderId');
      }
    } catch (e) {
      final errStr = e.toString();
      if (_paymentType == PaymentType.credit && (
        errStr.contains('credit') ||
        errStr.contains('Credit') ||
        errStr.contains('limit') ||
        errStr.contains('blocked')
      )) {
        if (mounted) {
          setState(() {
            _paymentType = PaymentType.cod;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$e. We have updated your payment method to Cash on Delivery (COD). Please click place order again to confirm.'),
              backgroundColor: Colors.amber[900],
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(l10n.orderPlacementFailed(errStr))),
          );
        }
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Widget _buildSectionCard(Widget child, Color kCardBg, Color kBorder) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kCardBg,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: kBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 16,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;
    final kBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA);
    final kCardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final kText = isDark ? Colors.white : const Color(0xFF1A1A1A);
    final kSubText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF555555);
    final kBorder = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
    final kTitleColor = isDark ? const Color(0xFF4CD964) : const Color(0xFF1E4D1E);
    const kGreen = Color(0xFF4CD964);
    const kGreenDark = Color(0xFF32B84A);

    final hasAddress = _selectedAddress != null;

    return Scaffold(
      backgroundColor: kBg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Custom Header matching Cart Screen
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GestureDetector(
                    onTap: () {
                      if (context.canPop()) {
                        context.pop();
                      } else {
                        context.go('/home');
                      }
                    },
                    child: Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: kCardBg,
                        shape: BoxShape.circle,
                        border: Border.all(color: kBorder),
                      ),
                      child: Icon(Icons.arrow_back, color: kText),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    l10n.checkoutTitle,
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: kTitleColor,
                      letterSpacing: -1,
                    ),
                  ),
                ],
              ),
            ),

            // Main Content (Scrollable cards)
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Delivery Address
                    _buildSectionCard(
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const HugeIcon(icon: HugeIcons.strokeRoundedLocation01, color: kGreen, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                l10n.deliveryAddressTitle,
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: kText),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (hasAddress) ...[
                            Text(
                              '${_selectedAddress['contact_name']} (${_selectedAddress['contact_phone']})',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kText),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _selectedAddress['address_line_1'] ?? '',
                              style: TextStyle(fontSize: 13, color: kSubText, fontWeight: FontWeight.w500),
                            ),
                            if (_selectedAddress['address_line_2'] != null && _selectedAddress['address_line_2'].toString().isNotEmpty)
                              Text(
                                _selectedAddress['address_line_2'],
                                style: TextStyle(fontSize: 13, color: kSubText, fontWeight: FontWeight.w500),
                              ),
                            if (_selectedAddress['landmark'] != null && _selectedAddress['landmark'].toString().isNotEmpty)
                              Text(
                                'Near ${_selectedAddress['landmark']}',
                                style: TextStyle(fontSize: 13, color: kSubText, fontWeight: FontWeight.w500),
                              ),
                            if (_selectedAddress['is_temp'] == true) ...[
                              const SizedBox(height: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF0C4A6E) : const Color(0xFFE0F2FE),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  l10n.thisTimeOnlyLabel,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0369A1),
                                  ),
                                ),
                              ),
                            ],
                          ] else
                            Text(
                              l10n.noAddressSelected,
                              style: TextStyle(fontSize: 13, color: kSubText, fontWeight: FontWeight.w500),
                            ),
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _showAddressSelectionDialog,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: kBg,
                                foregroundColor: kText,
                                elevation: 0,
                                side: BorderSide(color: kBorder),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              child: Text(
                                hasAddress ? l10n.changeAddressLabel : l10n.selectAddressLabel,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                              ),
                            ),
                          ),
                        ],
                      ),
                      kCardBg,
                      kBorder,
                    ),
                    const SizedBox(height: 12),

                    // Delivery Schedule
                    _buildSectionCard(
                      Row(
                        children: [
                          Container(
                            width: 48, height: 48,
                            decoration: BoxDecoration(
                              color: CartService.instance.selectedSlot == 'morning' ? const Color(0xFFE8F9EC) : const Color(0xFFFFECE0),
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              CartService.instance.selectedSlot == 'morning' ? '☀️' : '🌙',
                              style: const TextStyle(fontSize: 22),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  l10n.deliveryScheduleTitle,
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: kSubText, letterSpacing: 0.5),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  CartService.instance.selectedSlot == 'morning' ? '${l10n.morning} Slot (7 AM - 12 PM)' : '${l10n.evening} Slot (4 PM - 8 PM)',
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: kText),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'On ${CartService.instance.selectedDate.day}/${CartService.instance.selectedDate.month}/${CartService.instance.selectedDate.year}',
                                  style: TextStyle(fontSize: 12, color: kSubText, fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      kCardBg,
                      kBorder,
                    ),
                    const SizedBox(height: 12),

                    // Payment Method
                    _buildSectionCard(
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const HugeIcon(icon: HugeIcons.strokeRoundedCreditCard, color: kGreen, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                l10n.paymentMethodTitle,
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: kText),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                           Row(
                            children: PaymentType.values.map((type) {
                              final isSelected = _paymentType == type;
                              final isCredit = type == PaymentType.credit;
                              return Expanded(
                                child: GestureDetector(
                                  onTap: isCredit ? null : () => setState(() => _paymentType = type),
                                  child: Opacity(
                                    opacity: isCredit ? 0.6 : 1.0,
                                    child: AnimatedContainer(
                                      duration: const Duration(milliseconds: 150),
                                      margin: EdgeInsets.only(
                                        right: type == PaymentType.values.first ? 8 : 0,
                                        left: type == PaymentType.values.last ? 8 : 0,
                                      ),
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                      decoration: BoxDecoration(
                                        color: isSelected 
                                            ? (isDark ? const Color(0xFF103629) : const Color(0xFFE8F9EC))
                                            : kBg,
                                        border: Border.all(
                                          color: isSelected ? kGreen : kBorder,
                                          width: isSelected ? 1.5 : 1,
                                        ),
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            type == PaymentType.cod ? '💵 ' + l10n.cashOnDelivery : '🏦 ' + l10n.creditPayment,
                                            style: TextStyle(
                                              color: isSelected ? kGreenDark : kSubText,
                                              fontWeight: FontWeight.w700,
                                              fontSize: 13,
                                            ),
                                          ),
                                          if (isCredit) ...[
                                            const SizedBox(height: 4),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                gradient: const LinearGradient(
                                                  colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                                                ),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: const Text(
                                                'COMING SOON',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 8,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                      kCardBg,
                      kBorder,
                    ),
                    const SizedBox(height: 12),

                    // Order Summary (Clean, Item list only)
                    _buildSectionCard(
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const HugeIcon(icon: HugeIcons.strokeRoundedReceiptText, color: kGreen, size: 20),
                              const SizedBox(width: 8),
                              Text(
                                l10n.orderSummaryTitle,
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: kText),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          ...CartService.instance.items.map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    '${item.item.name} (${item.variant.label}) x ${item.quantity}',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: kText),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '₹ ${((item.variant.price ?? 0.0) * item.quantity).toStringAsFixed(0)}',
                                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: kText),
                                ),
                              ],
                            ),
                          )),
                        ],
                      ),
                      kCardBg,
                      kBorder,
                    ),
                  ],
                ),
              ),
            ),

            // Sticky Bottom Summary & Place Order Button
            Container(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
              decoration: BoxDecoration(
                color: kCardBg,
                border: Border(top: BorderSide(color: kBorder)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  )
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.totalAmountTitle,
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: kText),
                      ),
                      Text(
                        '₹ ${CartService.instance.finalTotal.toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: kGreen),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loading || !hasAddress ? null : _placeOrder,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kGreen,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                        elevation: 8,
                        shadowColor: kGreen.withOpacity(0.4),
                      ),
                      child: _loading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Text(
                              l10n.placeOrderButton,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
