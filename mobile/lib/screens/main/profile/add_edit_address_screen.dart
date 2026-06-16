import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';

class AddEditAddressScreen extends StatefulWidget {
  final String? addressId;
  const AddEditAddressScreen({super.key, this.addressId});

  @override
  State<AddEditAddressScreen> createState() => _AddEditAddressScreenState();
}

class _AddEditAddressScreenState extends State<AddEditAddressScreen> {
  final _formKey = GlobalKey<FormState>();
  final _contactName  = TextEditingController();
  final _contactPhone = TextEditingController();
  final _addr1        = TextEditingController();
  final _addr2        = TextEditingController();
  final _landmark     = TextEditingController();

  String _label = 'Home';
  bool _isDefault = false;
  bool _loading = false;
  bool _saving  = false;
  double? _lat;
  double? _lng;

  bool get _isEdit => widget.addressId != null;

  @override
  void initState() {
    super.initState();
    if (_isEdit) _loadAddress();
  }

  Future<void> _loadAddress() async {
    setState(() => _loading = true);
    final res = await supabase.from('user_addresses').select('*').eq('id', widget.addressId!).single();
    if (mounted) {
      final a = res;
      _contactName.text  = a['contact_name'] ?? '';
      _contactPhone.text = a['contact_phone'] ?? '';
      _addr1.text        = a['address_line_1'] ?? '';
      _addr2.text        = a['address_line_2'] ?? '';
      _landmark.text     = a['landmark'] ?? '';
      setState(() {
        _label     = a['label'] ?? 'Home';
        _isDefault = a['is_default'] ?? false;
        _lat       = a['latitude']?.toDouble();
        _lng       = a['longitude']?.toDouble();
        _loading   = false;
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final uid = supabase.auth.currentUser!.id;

    if (_isDefault) {
      await supabase.from('user_addresses').update({'is_default': false}).eq('user_id', uid);
    }

    final payload = {
      'user_id': uid,
      'label': _label,
      'contact_name': _contactName.text.trim(),
      'contact_phone': _contactPhone.text.trim(),
      'address_line_1': _addr1.text.trim(),
      'address_line_2': _addr2.text.trim().isEmpty ? null : _addr2.text.trim(),
      'landmark': _landmark.text.trim().isEmpty ? null : _landmark.text.trim(),
      'latitude': _lat,
      'longitude': _lng,
      'is_default': _isDefault,
      'is_active': true,
    };

    if (_isEdit) {
      await supabase.from('user_addresses').update(payload).eq('id', widget.addressId!);
    } else {
      await supabase.from('user_addresses').insert(payload);
    }

    if (mounted) {
      setState(() => _saving = false);
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(_isEdit ? l10n.editAddressTitle : l10n.addAddressButton)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Label
                  Text(l10n.labelFieldTitle, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: [l10n.labelHome, l10n.labelWork, l10n.labelOther].map((l) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(l),
                        selected: _label == l,
                        selectedColor: kWaGreen,
                        onSelected: (_) => setState(() => _label = l),
                      ),
                    )).toList(),
                  ),
                  const SizedBox(height: 16),

                  TextFormField(
                    controller: _contactName,
                    decoration: InputDecoration(labelText: l10n.contactNameLabel),
                    validator: (v) => v!.isEmpty ? l10n.fieldRequiredValidation : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _contactPhone,
                    decoration: InputDecoration(labelText: l10n.contactPhoneLabel),
                    keyboardType: TextInputType.phone,
                    validator: (v) => v!.isEmpty ? l10n.fieldRequiredValidation : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _addr1,
                    decoration: InputDecoration(labelText: l10n.addressLine1Label),
                    validator: (v) => v!.isEmpty ? l10n.fieldRequiredValidation : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _addr2,
                    decoration: InputDecoration(labelText: l10n.addressLine2Label),
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _landmark,
                    decoration: InputDecoration(labelText: l10n.landmarkLabel),
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),

                  // OSM map note
                  if (_lat != null && _lng != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: kBrand50,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: kNeutral200),
                      ),
                      child: Row(children: [
                        const HugeIcon(icon: HugeIcons.strokeRoundedLocation01, color: Color(0xFF128C7E)),
                        const SizedBox(width: 8),
                        Text('${_lat!.toStringAsFixed(5)}, ${_lng!.toStringAsFixed(5)}',
                            style: const TextStyle(fontSize: 13)),
                      ]),
                    ),

                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    icon: const HugeIcon(icon: HugeIcons.strokeRoundedGps01),
                    label: Text(l10n.pinMyLocationButton),
                    onPressed: () {
                      // OSM location picker — opens in browser or uses geolocator
                      // For now store rough coords via geolocation
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n.mapPickerComingSoon)),
                      );
                    },
                  ),
                  const SizedBox(height: 16),

                  CheckboxListTile(
                    title: Text(l10n.setAsDefaultAddress),
                    value: _isDefault,
                    activeColor: kWaGreen,
                    contentPadding: EdgeInsets.zero,
                    onChanged: (v) => setState(() => _isDefault = v ?? false),
                  ),
                  const SizedBox(height: 24),

                  ElevatedButton(
                    onPressed: _saving ? null : _save,
                    style: ElevatedButton.styleFrom(backgroundColor: kWaTeal),
                    child: _saving
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(_isEdit ? l10n.updateAddressButton : l10n.addAddressButton),
                  ),
                ],
              ),
            ),
    );
  }
}
