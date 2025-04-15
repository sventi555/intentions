import { PageWrapper } from "@/components/page-wrapper";
import { auth, functions } from "@/config/firebase";
import { useUser } from "@/hooks/user";
import { Link } from "expo-router";
import { signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { Button, ScrollView, Text, View } from "react-native";

const Feed = () => {
  const user = useUser();

  const followUser = httpsCallable(functions, "followUser");

  const follow = () => {
    followUser({ userId: "user-2" })
      .then(() => {})
      .catch(() => {});
  };

  // const { data } = useQuery({
  //   queryKey: ["feed", user?.uid],
  //   queryFn: async () => {
  //     const feedPostsQuery = query(
  //       collection(db, `/users/${user?.uid}/feed`),
  //       orderBy("createdAt"),
  //       limit(10),
  //     );
  //
  //     return getDocs(feedPostsQuery);
  //   },
  // });

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView>
        <PageWrapper>
          <View style={{ gap: 8 }}>
            <Button onPress={follow} title="booga" />
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
