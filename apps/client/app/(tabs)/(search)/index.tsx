import { collections } from '@/db';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { getDocs, query, where } from 'firebase/firestore';
import { useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useDebounce } from 'use-debounce';

const Search = () => {
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
    <View>
      <TextInput
        placeholder="Search username"
        value={username}
        onChangeText={setUsername}
      />
      <FlatList
        data={userResults}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: '/(tabs)/(search)/[userId]',
              params: { userId: item.id },
            }}
          >
            {item.data().username}
          </Link>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default Search;
