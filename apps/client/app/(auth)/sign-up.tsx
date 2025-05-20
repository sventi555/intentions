import { Input } from '@/components/text-input';
import { API_HOST, auth } from '@/config';
import { CreateUserBody } from '@lib';
import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Button, Switch, Text, View } from 'react-native';

const SignUp: React.FC = () => {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const [errMsg, setErrMsg] = useState('');

  const { mutateAsync: createUser } = useMutation({
    mutationFn: async (vars: CreateUserBody) => {
      await fetch(`${API_HOST}/users`, {
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

    try {
      await createUser({ email, username, password, isPrivate });
      await signInWithEmailAndPassword(auth, email, password);
      router.navigate('/(tabs)/(feed)');
    } catch {
      setErrMsg('Something went wrong, please try again.');
    }
  };

  return (
    <View
      style={{
        paddingHorizontal: 24,
        flex: 1,
        justifyContent: 'center',
        gap: 16,
        alignItems: 'center',
      }}
    >
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 48 }}>Intentions</Text>
        <Text style={{ fontSize: 18 }}>act intentionally</Text>
      </View>

      <View style={{ gap: 4 }}>
        <Input placeholder="username" value={username} onChange={setUsername} />
        <Input placeholder="email" value={email} onChange={setEmail} />
        <Input
          placeholder="password"
          value={password}
          onChange={setPassword}
          password={true}
        />
        <View
          style={{
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <Text>private account: </Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>
      </View>

      <View style={{ width: 200 }}>
        <Button title="create account" onPress={onCreateUser} />
        {errMsg ? <Text style={{ color: 'red' }}>{errMsg}</Text> : null}
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text>Already a user?</Text>
        <Link
          style={{ textDecorationLine: 'underline' }}
          href="/(auth)/sign-in"
        >
          Sign in
        </Link>
      </View>
    </View>
  );
};

export default SignUp;
