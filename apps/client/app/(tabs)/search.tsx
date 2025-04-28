import { db } from '@/config/firebase';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
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
            collection(db, 'users'),
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
        renderItem={({ item }) => <Text>{item.data().username}</Text>}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default Search;
