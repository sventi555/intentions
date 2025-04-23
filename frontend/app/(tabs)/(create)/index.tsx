import { PageWrapper } from "@/components/page-wrapper";
import { auth, db, functions } from "@/config/firebase";
import { Picker } from "@react-native-picker/picker";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Link } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useState } from "react";
import { Button, TextInput, View } from "react-native";

const CreatePost = () => {
  const [intentionId, setIntentionId] = useState("make-music");
  const [description, setDescription] = useState("");
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

  const onSubmit = async () => {
    const addPost = httpsCallable(functions, "addPost");
    await addPost({ intentionId, description, ...(image ? { image } : {}) });
  };

  const { data: intentions } = useQuery({
    queryKey: ["intentions"],
    queryFn: async () => {
      return (
        await getDocs(
          query(
            collection(db, "intentions"),
            where("userId", "==", auth.currentUser?.uid),
          ),
        )
      ).docs;
    },
  });

  return (
    <PageWrapper>
      <View style={{ gap: 8 }}>
        <Picker
          onValueChange={(val) => setIntentionId(val)}
          selectedValue={intentionId}
        >
          {intentions?.map((intention) => (
            <Picker.Item label={intention.data().name} value={intention.id} />
          ))}
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
          onChangeText={setDescription}
          value={description}
        />
        <Button title="post" onPress={onSubmit} />
      </View>
    </PageWrapper>
  );
};

export default CreatePost;
