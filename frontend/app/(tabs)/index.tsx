import { PageWrapper } from "@/components/page-wrapper";
import { Post } from "@/components/post";
import { auth, db } from "@/config/firebase";
import { useUser } from "@/hooks/user";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { ScrollView, Text, View } from "react-native";

const Feed = () => {
  const user = useUser();

  const { data } = useQuery({
    queryKey: ["feed", user?.uid],
    queryFn: async () => {
      const feedPostsQuery = query(
        collection(db, `/users/${user?.uid}/feed`),
        orderBy("createdAt"),
        limit(10),
      );

      return getDocs(feedPostsQuery);
    },
  });

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
      <View style={{ position: "absolute", top: 0, left: 0 }}>
        {user ? (
          <Text onPress={() => signOut(auth)}>Sign out</Text>
        ) : (
          <Link href="/sign-in">Sign in</Link>
        )}
      </View>
    </View>
  );
};

export default Feed;
