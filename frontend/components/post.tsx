import { Text, View } from "react-native";
import { Image } from "expo-image";

export const Post = () => {
  return (
    <View style={{ borderRadius: 8, borderWidth: 1, padding: 8, gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Image
          source="https://picsum.photos/64"
          style={{ width: 32, aspectRatio: 1, borderRadius: "100%" }}
        />
        <Text>John Doe</Text>
        <Text style={{ color: "grey" }}>5 days ago</Text>
      </View>
      <Text
        style={{
          borderWidth: 1,
          padding: 4,
          alignSelf: "flex-start",
          borderRadius: 8,
        }}
      >
        intention
      </Text>
      <Image
        source="https://picsum.photos/600"
        style={{ width: "100%", aspectRatio: 1 }}
      />
    </View>
  );
};
