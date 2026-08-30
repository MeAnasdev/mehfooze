export const Colors = {
  primary: '#005134',
  primaryContainer: '#006c46',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#92eaba',
  primaryFixedDim: '#81d8a9',
  inversePrimary: '#81d8a9',

  secondary: '#0054cc',
  secondaryContainer: '#336ee7',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#fefcff',
  secondaryFixedDim: '#b2c5ff',

  tertiary: '#782e2e',
  tertiaryContainer: '#964544',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#ffccc9',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  background: '#f4fbf3',
  onBackground: '#161d19',

  surface: '#f6faf5',
  surfaceBright: '#f6faf5',
  surfaceDim: '#d7dbd6',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eef6ee',
  surfaceContainer: '#ebefe9',
  surfaceContainerHigh: '#e3eae2',
  surfaceContainerHighest: '#dde4dd',
  surfaceTint: '#016c46',
  surfaceVariant: '#dfe4de',

  onSurface: '#181d19',
  onSurfaceVariant: '#3f4942',
  inverseSurface: '#2d322e',
  inverseOnSurface: '#eef2ec',

  outline: '#6c7a70',
  outlineVariant: '#bccabf',
} as const;

export const Spacing = {
  cardGap: 12,
  inlineSpacing: 8,
  sectionMargin: 24,
  containerPadding: 16,
} as const;

export const FontSize = {
  headlineLg: 32,
  headlineMd: 28,
  titleLg: 22,
  titleMd: 16,
  bodyLg: 16,
  bodyMd: 14,
  labelMd: 12,
  labelSm: 11,
} as const;

export const FontFamily = {
  publicSans: 'PublicSans',
  inter: 'Inter',
} as const;
