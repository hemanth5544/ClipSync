import { useNavigation } from "@react-navigation/native";
import { CommonActions } from "@react-navigation/native";

// Custom hook to avoid require cycles - uses React Navigation directly
export function useAppNavigation() {
  const navigation = useNavigation();
  
  return {
    navigate: (route: string, params?: any) => {
      navigation.navigate(route as any, params);
    },
    replace: (route: string, params?: any) => {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: route as any, params }],
        })
      );
    },
    goBack: () => {
      navigation.goBack();
    },
  };
}
