import { PageWrapper } from "@/components/page-wrapper";
import { Button, TextInput, View } from "react-native";

const SignUp = () => {
  return (
    <PageWrapper>
      <View>
        <TextInput placeholder="email" />
        <TextInput placeholder="password" />
        <TextInput placeholder="repeat password" />
        <Button title="create" />
      </View>
    </PageWrapper>
  );
};

export default SignUp;
