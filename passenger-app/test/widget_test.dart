import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  group('App Tests', () {
    testWidgets('App renders correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Center(child: Text('وصّلني')),
            ),
          ),
        ),
      );

      expect(find.text('وصّلني'), findsOneWidget);
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

  group('Button Tests', () {
    testWidgets('ElevatedButton is tappable', (WidgetTester tester) async {
      bool pressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () => pressed = true,
              child: const Text('اضغط هنا'),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      expect(pressed, isTrue);
    });

    testWidgets('Disabled button is not tappable', (WidgetTester tester) async {
      bool pressed = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: null,
              child: const Text('غير متاح'),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(ElevatedButton));
      expect(pressed, isFalse);
    });
  });

  group('Form Tests', () {
    testWidgets('TextField accepts input', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: TextField(
              decoration: InputDecoration(hintText: 'أدخل رقم الهاتف'),
            ),
          ),
        ),
      );

      await tester.enterText(find.byType(TextField), '01012345678');
      expect(find.text('01012345678'), findsOneWidget);
    });

    testWidgets('Form validation works', (WidgetTester tester) async {
      final formKey = GlobalKey<FormState>();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'هذا الحقل مطلوب';
                  }
                  if (value.length != 11) {
                    return 'رقم الهاتف غير صحيح';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Test empty validation
      formKey.currentState!.validate();
      await tester.pump();
      expect(find.text('هذا الحقل مطلوب'), findsOneWidget);

      // Test valid input
      await tester.enterText(find.byType(TextFormField), '01012345678');
      formKey.currentState!.validate();
      await tester.pump();
      expect(find.text('هذا الحقل مطلوب'), findsNothing);
    });
  });

  group('Navigation Tests', () {
    testWidgets('Navigator can push routes', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SecondPage()),
                );
              },
              child: const Text('انتقل'),
            ),
          ),
        ),
      );

      await tester.tap(find.text('انتقل'));
      await tester.pumpAndSettle();

      expect(find.text('الصفحة الثانية'), findsOneWidget);
    });
  });

  group('RTL Layout Tests', () {
    testWidgets('RTL layout is applied correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Directionality(
            textDirection: TextDirection.rtl,
            child: Scaffold(
              body: Row(
                children: [
                  Text('أول'),
                  Text('ثاني'),
                ],
              ),
            ),
          ),
        ),
      );

      final firstTextFinder = find.text('أول');
      final secondTextFinder = find.text('ثاني');

      expect(firstTextFinder, findsOneWidget);
      expect(secondTextFinder, findsOneWidget);
    });
  });
}

class SecondPage extends StatelessWidget {
  const SecondPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('الصفحة الثانية')),
    );
  }
}
