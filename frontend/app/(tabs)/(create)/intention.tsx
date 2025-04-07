import { PageWrapper } from "@/components/page-wrapper";
import { Button, TextInput, View } from "react-native";

const CreateIntention = () => {
  return (
    <PageWrapper>
      <View style={{ gap: 8 }}>
        <TextInput placeholder="Write an intention" />
        <Button title="Create" />
      </View>
    </PageWrapper>
  );
};

export default CreateIntention;
