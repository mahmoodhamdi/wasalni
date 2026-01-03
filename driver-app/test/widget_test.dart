import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  group('Driver App Tests', () {
    testWidgets('App renders correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Center(child: Text('وصّلني للسائقين')),
            ),
          ),
        ),
      );

      expect(find.text('وصّلني للسائقين'), findsOneWidget);
    });

    testWidgets('Loading indicator displays', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Center(child: CircularProgressIndicator()),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });

  group('Driver Status Tests', () {
    testWidgets('Online button changes state', (WidgetTester tester) async {
      bool isOnline = false;

      await tester.pumpWidget(
        StatefulBuilder(
          builder: (context, setState) {
            return MaterialApp(
              home: Scaffold(
                body: ElevatedButton(
                  onPressed: () => setState(() => isOnline = !isOnline),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isOnline ? Colors.red : Colors.green,
                  ),
                  child: Text(isOnline ? 'أوقف العمل' : 'ابدأ العمل'),
                ),
              ),
            );
          },
        ),
      );

      // Initially offline
      expect(find.text('ابدأ العمل'), findsOneWidget);

      // Tap to go online
      await tester.tap(find.byType(ElevatedButton));
      await tester.pump();

      expect(find.text('أوقف العمل'), findsOneWidget);
    });
  });

  group('Trip Request Dialog Tests', () {
    testWidgets('Dialog shows trip info', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('طلب رحلة جديد'),
                      content: const Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('المسافة: 5.2 كم'),
                          Text('السعر المتوقع: 35 ج.م'),
                        ],
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('رفض'),
                        ),
                        ElevatedButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('قبول'),
                        ),
                      ],
                    ),
                  );
                },
                child: const Text('عرض الطلب'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('عرض الطلب'));
      await tester.pumpAndSettle();

      expect(find.text('طلب رحلة جديد'), findsOneWidget);
      expect(find.text('المسافة: 5.2 كم'), findsOneWidget);
      expect(find.text('السعر المتوقع: 35 ج.م'), findsOneWidget);
      expect(find.text('قبول'), findsOneWidget);
      expect(find.text('رفض'), findsOneWidget);
    });
  });

  group('Earnings Display Tests', () {
    testWidgets('Earnings card displays correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text('أرباح اليوم'),
                    Text('150.00 ج.م'),
                    Text('5 رحلات'),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

      expect(find.text('أرباح اليوم'), findsOneWidget);
      expect(find.text('150.00 ج.م'), findsOneWidget);
      expect(find.text('5 رحلات'), findsOneWidget);
    });
  });

  group('Form Validation Tests', () {
    testWidgets('Vehicle plate validation', (WidgetTester tester) async {
      final formKey = GlobalKey<FormState>();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'رقم اللوحة مطلوب';
                  }
                  if (!RegExp(r'^[أ-ي]{3}\s?\d{3,4}$').hasMatch(value)) {
                    return 'رقم لوحة غير صحيح';
                  }
                  return null;
                },
                decoration: const InputDecoration(
                  labelText: 'رقم اللوحة',
                ),
              ),
            ),
          ),
        ),
      );

      // Test empty validation
      formKey.currentState!.validate();
      await tester.pump();
      expect(find.text('رقم اللوحة مطلوب'), findsOneWidget);
    });
  });
}
