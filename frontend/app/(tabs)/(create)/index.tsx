import { PageWrapper } from "@/components/page-wrapper";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Link } from "expo-router";
import { useState } from "react";
import { Button, TextInput, View } from "react-native";

const CreatePost = () => {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <PageWrapper>
      <View style={{ gap: 8 }}>
        <Picker>
          <Picker.Item label="Make music" value="make-music" />
          <Picker.Item label="Go to gym" value="go-to-gym" />
        </Picker>
        <Link href="/(tabs)/(create)/intention">+ Create intention</Link>
        <Button title="upload image" onPress={pickImage} />
        {image && (
          <Image source={image} style={{ width: "100%", aspectRatio: 1 }} />
        )}
        <TextInput
          placeholder="Add a description"
          multiline
          style={{ borderWidth: 1, height: 60 }}
        />
        <Button title="post" />
      </View>
    </PageWrapper>
  );
};

export default CreatePost;
