import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../theme/app_theme.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  List<Shop> _results = [];
  List<String> _recent = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _focus.requestFocus();
    _controller.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final q = _controller.text.trim();
    if (q.isEmpty) { setState(() => _results = []); return; }
    _search(q);
  }

  Future<void> _search(String q) async {
    setState(() => _loading = true);
    final res = await supabase
        .from('shops')
        .select('id, name, type')
        .ilike('name', '%$q%')
        .limit(20);
    if (mounted) {
      setState(() {
        _results = (res as List).map((j) => Shop.fromJson(j)).toList();
        _loading = false;
      });
    }
  }

  void _saveRecent(String term) {
    setState(() {
      _recent = [term, ..._recent.where((r) => r != term)].take(6).toList();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final q = _controller.text.trim();
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          focusNode: _focus,
          decoration: InputDecoration(
            hintText: l10n.searchShopsHint,
            border: InputBorder.none,
            hintStyle: const TextStyle(color: kNeutral400),
            filled: false,
          ),
          style: const TextStyle(fontSize: 16),
          textInputAction: TextInputAction.search,
        ),
        actions: [
          if (q.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear),
              onPressed: () { _controller.clear(); setState(() => _results = []); },
            ),
        ],
      ),
      body: q.isEmpty
          ? _recent.isEmpty
              ? Center(child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [const Text('🔍', style: TextStyle(fontSize: 48)), const SizedBox(height: 12), Text(l10n.searchForShopsLabel, style: const TextStyle(fontSize: 16))],
                ))
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Text(l10n.recentSearchesTitle, style: const TextStyle(fontWeight: FontWeight.w700)),
                        TextButton(onPressed: () => setState(() => _recent = []), child: Text(l10n.clearButtonLabel)),
                      ]),
                      Wrap(
                        spacing: 8, runSpacing: 8,
                        children: _recent.map((r) => ActionChip(
                          label: Text(r),
                          onPressed: () { _controller.text = r; _search(r); },
                        )).toList(),
                      ),
                    ],
                  ),
                )
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : _results.isEmpty
                  ? Center(child: Text(l10n.noShopsFound))
                  : ListView.separated(
                      itemCount: _results.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, i) {
                        final shop = _results[i];
                        return ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: kBrand100,
                            child: Text('🏪'),
                          ),
                          title: Text(shop.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text(shop.type ?? l10n.generalStoreFallback),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () {
                            _saveRecent(_controller.text.trim());
                            context.push('/home/shop/${shop.id}');
                          },
                        );
                      },
                    ),
    );
  }
}
