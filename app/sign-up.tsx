import { PageWrapper } from "@/components/page-wrapper";
import { useState } from "react";
import { Button, TextInput, View } from "react-native";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [passRepeat, setPassRepeat] = useState("");

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
        />
        <TextInput
          placeholder="repeat password"
          value={passRepeat}
          onChangeText={(text) => setPassRepeat(text)}
        />
        <Button title="create" />
      </View>
    </PageWrapper>
  );
};

export default SignUp;
