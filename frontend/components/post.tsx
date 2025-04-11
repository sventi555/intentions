import { dayjs } from "@/utils/time";
import { Image } from "expo-image";
import { Text, View } from "react-native";

interface PostProps {
  // TODO: embed username and profile pic in posts on BE
  user: {
    imageUrl?: string;
    username: string;
    id: string;
  };
  createdAt: number;
  // TODO: embed intention name in posts
  intention: {
    name: string;
    id: string;
  };
  imageUrl?: string;
  description?: string;
}

export const Post: React.FC<PostProps> = (props) => {
  return (
    <View style={{ borderRadius: 8, borderWidth: 1, padding: 8, gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {props.user.imageUrl ? (
          <Image
            source={props.user.imageUrl}
            style={{ width: 32, aspectRatio: 1, borderRadius: "100%" }}
          />
        ) : (
          <Text>DP</Text>
        )}
        <Text>{props.user.username}</Text>
        <Text style={{ color: "grey" }}>
          {dayjs(props.createdAt).fromNow()}
        </Text>
      </View>
      <Text
        style={{
          borderWidth: 1,
          padding: 4,
          alignSelf: "flex-start",
          borderRadius: 8,
        }}
      >
        {props.intention.name}
      </Text>
      {props.imageUrl ? (
        <Image
          source="https://picsum.photos/600"
          style={{ width: "100%", aspectRatio: 1 }}
        />
      ) : null}
      {props.description ? <Text>{props.description}</Text> : null}
    </View>
  );
};
