import { Post } from "@/components/post";
import { View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        paddingHorizontal: 8,
        alignItems: "center",
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          width: "100%",
          maxWidth: 600,
        }}
      >
        <Post />
        <Post />
      </View>
    </View>
  );
}
