import { Post } from "@/components/post";
import { ScrollView, View } from "react-native";

const Feed = () => {
  return (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 8,
        alignItems: "center",
      }}
    >
      <View
        style={{
          paddingVertical: 8,
          gap: 8,
          width: "100%",
          maxWidth: 600,
        }}
      >
        <Post />
        <Post />
      </View>
    </ScrollView>
  );
};

export default Feed;
