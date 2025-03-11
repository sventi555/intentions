import { Button, Text, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Link, Stack } from "expo-router";

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
    <View style={{ alignItems: "center", paddingHorizontal: 8 }}>
      <View
        style={{ maxWidth: 600, width: "100%", gap: 8, paddingVertical: 8 }}
      >
        <Picker>
          <Picker.Item label="Make music" value="make-music" />
          <Picker.Item label="Go to gym" value="go-to-gym" />
        </Picker>

        <Button title="upload image" onPress={pickImage} />
        <Link href="/(tabs)/(create)/intention">Create intention</Link>
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
    </View>
  );
};

export default CreatePost;
