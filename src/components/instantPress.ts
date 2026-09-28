import { PressableProps } from 'react-native';

// react-native-web delays onPressIn by 50ms by default, and never fires it for a tap released sooner
// unless onPress is also set. delayPressIn is the web prop; unstable_pressDelay is the native one.
export const instantPressProps = { delayPressIn: 0, unstable_pressDelay: 0 } as PressableProps;
