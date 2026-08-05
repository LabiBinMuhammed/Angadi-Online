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
  final _houseName    = TextEditingController();
  final _addr1        = TextEditingController();
  final _addr2        = TextEditingController();
  final _landmark     = TextEditingController();
  final _village      = TextEditingController();
  final _deliveryNote = TextEditingController();

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

  @override
  void dispose() {
    _contactName.dispose();
    _contactPhone.dispose();
    _houseName.dispose();
    _addr1.dispose();
    _addr2.dispose();
    _landmark.dispose();
    _village.dispose();
    _deliveryNote.dispose();
    super.dispose();
  }

  Future<void> _loadAddress() async {
    setState(() => _loading = true);
    try {
      final res = await supabase.from('user_addresses').select('*').eq('id', widget.addressId!).single();
      if (mounted) {
        final a = res;
        _contactName.text  = a['contact_name'] ?? '';
        _contactPhone.text = a['contact_phone'] ?? '';
        _houseName.text    = a['house_name'] ?? '';
        _addr1.text        = a['address_line_1'] ?? '';
        _addr2.text        = a['address_line_2'] ?? '';
        _landmark.text     = a['landmark'] ?? '';
        _village.text      = a['village'] ?? '';
        _deliveryNote.text = a['delivery_note'] ?? '';
        setState(() {
          _label     = a['label'] ?? 'Home';
          _isDefault = a['is_default'] ?? false;
          _lat       = a['latitude']?.toDouble();
          _lng       = a['longitude']?.toDouble();
          _loading   = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading address: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    
    // Validate map selection
    if (_lat == null || _lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please pin your location on the map. Map location is required.'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() => _saving = true);
    final uid = supabase.auth.currentUser!.id;

    try {
      if (_isDefault) {
        await supabase.from('user_addresses').update({'is_default': false}).eq('user_id', uid);
      }

      final payload = {
        'user_id': uid,
        'label': _label,
        'contact_name': _contactName.text.trim(),
        'contact_phone': _contactPhone.text.trim(),
        'house_name': _houseName.text.trim(),
        'address_line_1': _addr1.text.trim().isEmpty ? null : _addr1.text.trim(),
        'address_line_2': _addr2.text.trim().isEmpty ? null : _addr2.text.trim(),
        'landmark': _landmark.text.trim(),
        'village': _village.text.trim(),
        'delivery_note': _deliveryNote.text.trim().isEmpty ? null : _deliveryNote.text.trim(),
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
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving address: $e'), backgroundColor: Colors.redAccent),
        );
      }
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
                  // 1. Address Label Selection
                  const Text('Address Label', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: ['Home', 'Work', 'Hostel', 'Other'].map((l) => Padding(
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

                  // 2. Receiver Name
                  TextFormField(
                    controller: _contactName,
                    decoration: const InputDecoration(
                      labelText: 'Receiver Name *',
                      hintText: 'Enter name of receiver',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'Receiver Name is required' : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),

                  // 3. Phone Number
                  TextFormField(
                    controller: _contactPhone,
                    decoration: const InputDecoration(
                      labelText: 'Phone Number *',
                      hintText: 'Enter contact phone number',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.phone,
                    validator: (v) => v == null || v.isEmpty ? 'Phone number is required' : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),

                  // 4. House Name
                  TextFormField(
                    controller: _houseName,
                    decoration: const InputDecoration(
                      labelText: 'House Name *',
                      hintText: 'e.g. Nadukkandi House, Cheriya Parambil',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'House Name is required' : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),

                  // 5. Road / Area (Optional)
                  TextFormField(
                    controller: _addr1,
                    decoration: const InputDecoration(
                      labelText: 'Road / Area (Optional)',
                      hintText: 'e.g. Bypass Road, Mosque Lane',
                      border: OutlineInputBorder(),
                    ),
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),

                  // 6. Landmark (Required)
                  TextFormField(
                    controller: _landmark,
                    decoration: const InputDecoration(
                      labelText: 'Landmark *',
                      hintText: 'e.g. Near Juma Masjid, Opp. High School',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'Landmark is required to locate the home' : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),

                  // 7. Village (Required)
                  TextFormField(
                    controller: _village,
                    decoration: const InputDecoration(
                      labelText: 'Village *',
                      hintText: 'e.g. Vadassery, Koduvally',
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v == null || v.isEmpty ? 'Village is required' : null,
                    textInputAction: TextInputAction.next,
                  ),
                  const SizedBox(height: 16),

                  // 8. Delivery Note
                  TextFormField(
                    controller: _deliveryNote,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Delivery Note (Optional)',
                      hintText: 'e.g. Blue gate, Call before arrival, 2nd house after bridge',
                      border: OutlineInputBorder(),
                    ),
                    textInputAction: TextInputAction.done,
                  ),
                  const SizedBox(height: 16),

                  // 9. Map Location (Required)
                  const Text('Map Location *', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Positioned.fill(
                            child: GridPaper(
                              color: kWaGreen.withOpacity(0.1),
                              divisions: 2,
                              subdivisions: 2,
                              child: Container(
                                color: Colors.blue[50]?.withOpacity(0.5),
                              ),
                            ),
                          ),
                          const Positioned(
                            top: 30, left: 50,
                            child: Text('🏫 School', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          ),
                          const Positioned(
                            bottom: 40, right: 60,
                            child: Text('🕌 Mosque', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          ),
                          const Positioned(
                            top: 100, right: 30,
                            child: Text('🏪 Market', style: TextStyle(fontSize: 12, color: Colors.grey)),
                          ),
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.only(bottom: 24),
                              child: Icon(Icons.location_on, color: Colors.red, size: 40),
                            ),
                          ),
                          Positioned(
                            bottom: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                              ),
                              child: Text(
                                _lat != null && _lng != null
                                    ? '📌 Pin Set: ${_lat!.toStringAsFixed(4)}, ${_lng!.toStringAsFixed(4)}'
                                    : 'Select on Map',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.gps_fixed),
                    label: const Text('Pin Current Location'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: kWaTeal,
                      side: BorderSide(color: kWaTeal),
                    ),
                    onPressed: () {
                      setState(() {
                        // Set standard village coordinates with randomized offset
                        _lat = 11.2588 + (DateTime.now().millisecond % 100) * 0.0001;
                        _lng = 75.7804 + (DateTime.now().millisecond % 100) * 0.0001;
                      });
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
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kWaTeal,
                      minimumSize: const Size.fromHeight(48),
                    ),
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
