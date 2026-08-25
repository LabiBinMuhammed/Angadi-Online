import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'l10n/app_localizations.dart';
import 'core/language_service.dart';
import 'core/router.dart';
import 'core/supabase_client.dart';
import 'core/location_service.dart';
import 'theme/app_theme.dart';
import 'theme/theme_service.dart';

Future<void> main() async {
  try {
    WidgetsFlutterBinding.ensureInitialized();

    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseAnon,
    );

    await ThemeService.instance.init();
    await LanguageService.instance.initialize();
    await LocationService.instance.init();

    runApp(const VillageMarketApp());
  } catch (e, stack) {
    runApp(MaterialApp(
      home: Scaffold(
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'FATAL ERROR ON STARTUP:\n$e\n\n$stack',
              style: const TextStyle(color: Colors.red, fontSize: 14),
            ),
          ),
        ),
      ),
    ));
  }
}

class VillageMarketApp extends StatelessWidget {
  const VillageMarketApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([ThemeService.instance, LanguageService.instance]),
      builder: (context, _) {
        final isDark = ThemeService.instance.isDarkMode;
        final currentLocale = LanguageService.instance.locale;
        return MaterialApp.router(
          title: 'Angadi',
          debugShowCheckedModeBanner: false,
          theme: buildAppTheme(isDarkMode: isDark, localeCode: currentLocale.languageCode),

          routerConfig: buildRouter(),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          locale: currentLocale,
          builder: (context, child) {
            final mediaQuery = MediaQuery.of(context);
            final isMalayalam = currentLocale.languageCode == 'ml';
            if (isMalayalam) {
              return MediaQuery(
                data: mediaQuery.copyWith(
                  textScaler: _MultiplierTextScaler(mediaQuery.textScaler, 0.80),
                ),
                child: child!,
              );
            }
            return child!;
          },
        );
      },
    );
  }
}

class _MultiplierTextScaler extends TextScaler {
  final TextScaler delegate;
  final double multiplier;

  const _MultiplierTextScaler(this.delegate, this.multiplier);

  @override
  double scale(double fontSize) {
    return delegate.scale(fontSize) * multiplier;
  }

  @override
  double get textScaleFactor => delegate.textScaleFactor * multiplier;
}

