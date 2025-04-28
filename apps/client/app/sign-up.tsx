import { PageWrapper } from '@/components/page-wrapper';
import { auth } from '@/config/firebase';
import { CreateUserBody } from '@lib';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Button, Switch, Text, TextInput, View } from 'react-native';

const SignUp = () => {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passRepeat, setPassRepeat] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const [errMsg, setErrMsg] = useState('');

  const { mutateAsync: createUser } = useMutation({
    mutationFn: async (vars: CreateUserBody) => {
      await fetch(`${process.env.EXPO_PUBLIC_API_HOST}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vars),
      });
    },
  });

  const onCreateUser = async () => {
    setErrMsg('');

    if (password !== passRepeat) {
      setErrMsg('passwords do not match');
      return;
    }

    try {
      await createUser({ email, username, password, isPrivate });
      await signInWithEmailAndPassword(auth, email, password);
      router.navigate('/(tabs)');
    } catch {
      setErrMsg('Something went wrong, please try again.');
    }
  };

  return (
    <PageWrapper>
      <View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Text>Private account:</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>
        <TextInput
          placeholder="username"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput placeholder="email" value={email} onChangeText={setEmail} />
        <TextInput
          placeholder="password"
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          placeholder="repeat password"
          value={passRepeat}
          onChangeText={setPassRepeat}
          onSubmitEditing={onCreateUser}
        />
        <Button title="create" onPress={onCreateUser} />
        {errMsg ? <Text style={{ color: 'red' }}>{errMsg}</Text> : null}
        <Link href="/sign-in">Sign in</Link>
      </View>
    </PageWrapper>
  );
};

export default SignUp;
