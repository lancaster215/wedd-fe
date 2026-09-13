import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { ProfileCircle } from "reicon-react-native";

type AvatarProps = {
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export default function Avatar({
  size = 44,
  color = "#FF6757",
  backgroundColor = "#FFE8E4",
  style,
}: AvatarProps) {
  return (
    <View
      accessibilityLabel="User avatar"
      accessibilityRole="image"
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      <ProfileCircle color={color} size={size} weight="Filled" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
