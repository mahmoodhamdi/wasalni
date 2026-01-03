import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:driver_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      const ProviderScope(
        child: WasalniDriverApp(),
      ),
    );

    // Wait for the splash screen to load
    await tester.pump();

    // Verify that the app loads without errors
    expect(find.byType(WasalniDriverApp), findsOneWidget);
  });
}
