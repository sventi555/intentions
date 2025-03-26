import { PageWrapper } from "@/components/page-wrapper";
import { Link, useRouter } from "expo-router";
import { Button, Text, TextInput } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { auth } from "@/firebaseConfig";

const SignIn = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const [errMsg, setErrMsg] = useState("");

  const signIn = () =>
    signInWithEmailAndPassword(auth, email, pass)
      .then(() => router.navigate("/(tabs)"))
      .catch((err) => setErrMsg(err.message));

  return (
    <PageWrapper>
      <TextInput
        placeholder="email"
        value={email}
        onChangeText={(text) => setEmail(text)}
      />
      <TextInput
        placeholder="password"
        value={pass}
        onChangeText={(text) => setPass(text)}
        onSubmitEditing={signIn}
      />
      <Button title="login" onPress={signIn} />
      {errMsg ? <Text style={{ color: "red" }}>{errMsg}</Text> : null}
      <Link href="/sign-up">Create account</Link>
    </PageWrapper>
  );
};

export default SignIn;
