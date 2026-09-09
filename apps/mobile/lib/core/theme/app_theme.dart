import 'package:flex_color_scheme/flex_color_scheme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Premium palette — vibrant blue-violet primary with warm coral accents
  static const Color primaryColor = Color(0xFF6C63FF); // Vibrant indigo-violet
  static const Color secondaryColor = Color(0xFFFF6B6B); // Warm coral
  static const Color tertiaryColor = Color(0xFF2EC4B6); // Fresh teal

  // Gradient colors for hero sections
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF6C63FF), Color(0xFF3B82F6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient warmGradient = LinearGradient(
    colors: [Color(0xFFFF6B6B), Color(0xFFFFA502)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient surfaceGradient = LinearGradient(
    colors: [Color(0xFFF8F9FF), Color(0xFFEEF2FF)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient darkSurfaceGradient = LinearGradient(
    colors: [Color(0xFF0F0F1A), Color(0xFF1A1A2E)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static ThemeData light = FlexThemeData.light(
    colors: const FlexSchemeColor(
      primary: primaryColor,
      primaryContainer: Color(0xFFE8E6FF),
      secondary: secondaryColor,
      secondaryContainer: Color(0xFFFFE0E0),
      tertiary: tertiaryColor,
      tertiaryContainer: Color(0xFFD0F5F0),
      appBarColor: Color(0xFFF8F9FF),
      error: Color(0xFFE53935),
    ),
    surfaceMode: FlexSurfaceMode.highScaffoldLowSurface,
    blendLevel: 4,
    subThemesData: const FlexSubThemesData(
      blendOnLevel: 6,
      blendOnColors: false,
      useTextTheme: true,
      useM2StyleDividerInM3: true,
      alignedDropdown: true,
      useInputDecoratorThemeInDialogs: true,
      inputDecoratorSchemeColor: SchemeColor.primary,
      inputDecoratorBackgroundAlpha: 12,
      inputDecoratorRadius: 16.0,
      inputDecoratorUnfocusedHasBorder: false,
      inputDecoratorFocusedHasBorder: true,
      inputDecoratorPrefixIconSchemeColor: SchemeColor.primary,
      cardRadius: 20.0,
      cardElevation: 0,
      filledButtonRadius: 16.0,
      elevatedButtonRadius: 16.0,
      outlinedButtonRadius: 16.0,
      chipRadius: 12.0,
      bottomNavigationBarElevation: 0,
      navigationBarIndicatorSchemeColor: SchemeColor.primary,
    ),
    visualDensity: FlexColorScheme.comfortablePlatformDensity,
    useMaterial3: true,
    fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
  );

  static ThemeData dark = FlexThemeData.dark(
    colors: const FlexSchemeColor(
      primary: Color(0xFF9D97FF), // Lighter violet for dark
      primaryContainer: Color(0xFF2A2750),
      secondary: Color(0xFFFF8A8A), // Lighter coral
      secondaryContainer: Color(0xFF4A2020),
      tertiary: Color(0xFF5EDDD0), // Lighter teal
      tertiaryContainer: Color(0xFF1A3A36),
      appBarColor: Color(0xFF0F0F1A),
      error: Color(0xFFEF5350),
    ),
    surfaceMode: FlexSurfaceMode.highScaffoldLowSurface,
    blendLevel: 15,
    subThemesData: const FlexSubThemesData(
      blendOnLevel: 20,
      useTextTheme: true,
      useM2StyleDividerInM3: true,
      alignedDropdown: true,
      useInputDecoratorThemeInDialogs: true,
      inputDecoratorSchemeColor: SchemeColor.primary,
      inputDecoratorBackgroundAlpha: 22,
      inputDecoratorRadius: 16.0,
      inputDecoratorUnfocusedHasBorder: false,
      inputDecoratorFocusedHasBorder: true,
      inputDecoratorPrefixIconSchemeColor: SchemeColor.primary,
      cardRadius: 20.0,
      cardElevation: 0,
      filledButtonRadius: 16.0,
      elevatedButtonRadius: 16.0,
      outlinedButtonRadius: 16.0,
      chipRadius: 12.0,
      bottomNavigationBarElevation: 0,
      navigationBarIndicatorSchemeColor: SchemeColor.primary,
    ),
    visualDensity: FlexColorScheme.comfortablePlatformDensity,
    useMaterial3: true,
    fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
  );
}
