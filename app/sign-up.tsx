import { PageWrapper } from "@/components/page-wrapper";
import { auth } from "@/firebaseConfig";
import { Link, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { TextInput, View, Button, Text } from "react-native";

const SignUp = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [passRepeat, setPassRepeat] = useState("");

  const [errMsg, setErrMsg] = useState("");

  const createUser = () => {
    if (pass !== passRepeat) {
      return;
    }

    createUserWithEmailAndPassword(auth, email, pass)
      .then(() => router.navigate("/(tabs)"))
      .catch((err) => setErrMsg(err.message));
  };

  return (
    <PageWrapper>
      <View>
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
        />
        <Button title="create" onPress={createUser} />
        {errMsg ? <Text style={{ color: "red" }}>{errMsg}</Text> : null}
        <Link href="/sign-in">Sign in</Link>
      </View>
    </PageWrapper>
  );
};

export default SignUp;
