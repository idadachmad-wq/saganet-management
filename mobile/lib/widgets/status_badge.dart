import 'package:flutter/material.dart';
import 'package:saganet_mobile/theme.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge(this.label, {super.key, this.tone = BadgeTone.neutral});

  final String label;
  final BadgeTone tone;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      BadgeTone.ok => (SagaColors.brandSoft, SagaColors.brandStrong),
      BadgeTone.warn => (const Color(0xFFFEF3C7), const Color(0xFFB45309)),
      BadgeTone.danger => (const Color(0xFFFEE2E2), const Color(0xFFB91C1C)),
      BadgeTone.neutral => (const Color(0xFFE5E7EB), SagaColors.muted),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }
}

enum BadgeTone { ok, warn, danger, neutral }

BadgeTone toneForPsb(String status) {
  return switch (status) {
    'aktif' => BadgeTone.ok,
    'batal' => BadgeTone.danger,
    'install' || 'survey' => BadgeTone.warn,
    _ => BadgeTone.neutral,
  };
}

BadgeTone toneForCustomer(String status) {
  return switch (status) {
    'aktif' => BadgeTone.ok,
    'isolir' => BadgeTone.warn,
    'putus' => BadgeTone.danger,
    _ => BadgeTone.neutral,
  };
}
