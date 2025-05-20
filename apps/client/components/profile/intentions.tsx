import { IntentionOrderField, useUserIntentions } from '@/hooks/intentions';
import { useIntentionPath } from '@/hooks/navigation';
import { dayjs } from '@/utils/time';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Intention } from '@lib';
import { Picker } from '@react-native-picker/picker';
import { Link } from 'expo-router';
import { OrderByDirection } from 'firebase/firestore';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';

const orderLabels = {
  updatedAt: 'Active',
  name: 'Name',
  postCount: 'Total posts',
} as const satisfies Partial<Record<IntentionOrderField, string>>;

type OrderField = keyof typeof orderLabels;

export const ProfileIntentions: React.FC<{ userId: string }> = ({ userId }) => {
  const [orderBy, setOrderBy] = useState<OrderField>('updatedAt');
  const [orderDir, setOrderDir] = useState<OrderByDirection>('asc');

  const { intentions } = useUserIntentions(userId, {
    by: orderBy,
    dir: getAdjustedDir(orderBy, orderDir),
  });

  return (
    <FlatList
      ListHeaderComponent={() => (
        <View style={{ flexDirection: 'row' }}>
          <Picker
            onValueChange={(val) => setOrderBy(val)}
            selectedValue={orderBy}
          >
            {Object.entries(orderLabels).map(([field, label]) => (
              <Picker.Item key={field} label={label} value={field} />
            ))}
          </Picker>

          <Text
            onPress={() => setOrderDir(orderDir === 'asc' ? 'desc' : 'asc')}
          >
            {orderDir === 'asc' ? (
              <FontAwesome name="chevron-up" />
            ) : (
              <FontAwesome name="chevron-down" />
            )}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={{}}>
          <IntentionListItem id={item.id} intention={item.data()} />
        </View>
      )}
      ItemSeparatorComponent={() => (
        <View
          style={{ height: 1, backgroundColor: 'gray', marginVertical: 4 }}
        />
      )}
      data={intentions}
      keyExtractor={(intention) => intention.id}
    />
  );
};

const getAdjustedDir = (
  orderField: OrderField,
  dir: OrderByDirection,
): OrderByDirection => {
  if (orderField === 'postCount' || orderField === 'updatedAt') {
    return dir === 'asc' ? 'desc' : 'asc';
  }

  return dir;
};

const IntentionListItem: React.FC<{ id: string; intention: Intention }> = ({
  id,
  intention,
}) => {
  const intentionPath = useIntentionPath(id);

  if (!intentionPath) {
    return null;
  }

  return (
    <Link href={intentionPath}>
      <View style={{ flexDirection: 'column' }}>
        <Text>{intention.name}</Text>
        <Text>Active {dayjs(intention.updatedAt).fromNow()}</Text>
        <Text>Total posts: {intention.postCount}</Text>
      </View>
    </Link>
  );
};
