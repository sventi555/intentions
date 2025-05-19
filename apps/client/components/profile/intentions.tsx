import {
  INTENTION_ORDER_FIELDS,
  IntentionOrderField,
  UserIntentionsOrder,
  useUserIntentions,
} from '@/hooks/intentions';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

export const ProfileIntentions: React.FC<{ userId: string }> = ({ userId }) => {
  const [order, setOrder] = useState<UserIntentionsOrder>({
    by: 'name',
    dir: 'asc',
  });

  const { intentions } = useUserIntentions(userId, order);

  return (
    <FlatList
      ListHeaderComponent={() => (
        <View style={{ flexDirection: 'row' }}>
          <Picker
            onValueChange={(val) => setOrder({ ...order, by: val })}
            selectedValue={order.by}
          >
            {INTENTION_ORDER_FIELDS.map((field) => (
              <Picker.Item
                key={field}
                label={orderLabels[field]}
                value={field}
              />
            ))}
          </Picker>

          <Text
            onPress={() =>
              setOrder({ ...order, dir: order.dir === 'asc' ? 'desc' : 'asc' })
            }
          >
            {order.dir === 'asc' ? (
              <FontAwesome name="chevron-up" />
            ) : (
              <FontAwesome name="chevron-down" />
            )}
          </Text>
        </View>
      )}
      renderItem={({ item }) => {
        const intention = item.data();

        return (
          <View>
            <Text>{intention.name}</Text>
          </View>
        );
      }}
      data={intentions}
      keyExtractor={(intention) => intention.id}
    />
  );
};

const orderLabels: Record<IntentionOrderField, string> = {
  updatedAt: 'Active',
  name: 'Name',
  postCount: 'Total posts',
};
