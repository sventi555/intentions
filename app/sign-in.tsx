import { PageWrapper } from "@/components/page-wrapper";
import { Button, TextInput } from "react-native";

const SignIn = () => {
  return (
    <PageWrapper>
      <TextInput placeholder="email" />
      <TextInput placeholder="password" />
      <Button title="login" />
    </PageWrapper>
  );
};

export default SignIn;
