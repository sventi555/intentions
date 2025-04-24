import { PageWrapper } from "@/components/page-wrapper";
import { auth, functions } from "@/config/firebase";
import { Link, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { Button, Switch, Text, TextInput, View } from "react-native";

const SignUp = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passRepeat, setPassRepeat] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const [errMsg, setErrMsg] = useState("");

  const createUser = async () => {
    setErrMsg("");

    if (password !== passRepeat) {
      setErrMsg("passwords do not match");
      return;
    }

    try {
      const createUserFn = httpsCallable(functions, "createUser");
      await createUserFn({ email, username, password, isPrivate });
      await signInWithEmailAndPassword(auth, email, password);
      router.navigate("/(tabs)");
    } catch (err) {
      setErrMsg("Something went wrong, please try again.");
    }
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
          value={password}
          onChangeText={(text) => setPassword(text)}
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
