declare module '@react-navigation/native' {
  export function useNavigation(): any;
  export function useRoute(): any;
  export function NavigationContainer(props: any): any;
}

declare module 'react-native-safe-area-context' {
  export function SafeAreaProvider(props: { children: React.ReactNode }): any;
  export function useSafeAreaInsets(): { top: number; bottom: number; left: number; right: number };
}
