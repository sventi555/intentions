import { PageWrapper } from "@/components/page-wrapper";
import { Post } from "@/components/post";
import { auth, db } from "@/firebaseConfig";
import { useUser } from "@/hooks/user";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { Button, ScrollView, Text, View } from "react-native";

const Feed = () => {
  const user = useUser();

  //const { data } = useQuery({
  //  queryKey: ["docs"],
  //  queryFn: async () => {
  //    const query = await getDocs(collection(db, "test"));
  //    return query.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  //  },
  //});

  //console.log("data", data);

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView>
        <Button
          onPress={() => {
            if (user) {
              const batch = writeBatch(db);
              const userRef = doc(db, "users", user.uid);
              batch.set(userRef, { username: "sventi555" });

              const usernameRef = doc(db, "index/users/username", "sventi555");
              batch.set(usernameRef, { userId: user.uid });

              batch
                .commit()
                .then(() => console.log("success"))
                .catch((e) => console.log("failure", e));
            }
          }}
          title="Do the thing"
        />
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
