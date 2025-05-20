import { DisplayPic } from '@/components/display-pic';
import { Input } from '@/components/text-input';
import { collections } from '@/db';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { getDocs, query, where } from 'firebase/firestore';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useDebounce } from 'use-debounce';

const Search: React.FC = () => {
  const [username, setUsername] = useState('');
  const [debouncedUsername] = useDebounce(username, 500);

  const { data: userResults } = useQuery({
    queryKey: ['users-search', debouncedUsername],
    queryFn: async () => {
      return (
        await getDocs(
          query(
            collections.users(),
            where('username', '==', debouncedUsername),
          ),
        )
      ).docs;
    },
  });

  return (
    <View style={{ gap: 8, padding: 8 }}>
      <Input
        value={username}
        onChange={setUsername}
        placeholder="Search username"
      />
      <FlatList
        data={userResults}
        renderItem={({ item }) => {
          const user = item.data();

          return (
            <Link
              asChild={true}
              href={{
                pathname: '/(tabs)/(search)/user/[userId]',
                params: { userId: item.id },
              }}
            >
              <View
                style={{ alignItems: 'center', flexDirection: 'row', gap: 4 }}
              >
                <DisplayPic user={user} />
                <Text>{user.username}</Text>
              </View>
            </Link>
          );
        }}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default Search;
