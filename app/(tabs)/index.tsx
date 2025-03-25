import { PageWrapper } from "@/components/page-wrapper";
import { Post } from "@/components/post";
import { ScrollView, View } from "react-native";

const Feed = () => {
  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView>
        <PageWrapper>
          <View style={{ gap: 8 }}>
            <Post />
            <Post />
          </View>
        </PageWrapper>
      </ScrollView>
    </View>
  );
};

export default Feed;
