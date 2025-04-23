import { PageWrapper } from "@/components/page-wrapper";
import { auth } from "@/config/firebase";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Button, Switch, Text, TextInput, View } from "react-native";

const SignUp = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [passRepeat, setPassRepeat] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const [errMsg, setErrMsg] = useState("");

  const createUser = async () => {
    setErrMsg("");

    if (pass !== passRepeat) {
      setErrMsg("passwords do not match");
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, pass);

      // const batch = writeBatch(db);
      //
      // const userDoc = doc(db, "/users", user.uid);
      // batch.set(userDoc, { username, private: isPrivate });
      //
      // const usernameDoc = doc(db, "/usernames", username);
      // batch.set(usernameDoc, { userId: user.uid });
      //
      // await batch.commit();
    } catch (err) {
      setErrMsg("Something went wrong, please try again.");
    }

    router.navigate("/(tabs)");
  };

  return (
    <PageWrapper>
      <View>
        <View style={{ flexDirection: "row", gap: 4 }}>
          <Text>Private account:</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>
        <TextInput
          placeholder="username"
          value={username}
          onChangeText={(text) => setUsername(text)}
        />
        <TextInput
          placeholder="email"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />
        <TextInput
          placeholder="password"
          value={pass}
          onChangeText={(text) => setPass(text)}
          onSubmitEditing={createUser}
        />
        <TextInput
          placeholder="repeat password"
          value={passRepeat}
          onChangeText={(text) => setPassRepeat(text)}
          onSubmitEditing={createUser}
        />
        <Button title="create" onPress={createUser} />
        {errMsg ? <Text style={{ color: "red" }}>{errMsg}</Text> : null}
        <Link href="/sign-in">Sign in</Link>
      </View>
    </PageWrapper>
  );
};

export default SignUp;
