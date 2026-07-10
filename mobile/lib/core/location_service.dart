import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocationService extends ChangeNotifier {
  static final LocationService instance = LocationService._internal();
  LocationService._internal();

  String? _selectedLocationId;
  String? _selectedLocationName;

  String? get selectedLocationId => _selectedLocationId;
  String? get selectedLocationName => _selectedLocationName;

  Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _selectedLocationId = prefs.getString('selected_location_id');
      _selectedLocationName = prefs.getString('selected_location_name');
      notifyListeners();
    } catch (e) {
      debugPrint('Error initializing LocationService: $e');
    }
  }

  Future<void> setLocation(String? id, String? name) async {
    _selectedLocationId = id;
    _selectedLocationName = name;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      if (id == null || name == null) {
        await prefs.remove('selected_location_id');
        await prefs.remove('selected_location_name');
      } else {
        await prefs.setString('selected_location_id', id);
        await prefs.setString('selected_location_name', name);
      }
    } catch (e) {
      debugPrint('Error saving location selection: $e');
    }
  }
}
