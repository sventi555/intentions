import { Input } from '@/components/text-input';
import { auth } from '@/config';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Button, Text, View } from 'react-native';

const SignIn: React.FC = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const [errMsg, setErrMsg] = useState('');

  const signIn = () =>
    signInWithEmailAndPassword(auth, email, pass)
      .then(() => router.navigate('/(tabs)/(feed)'))
      .catch((err) => setErrMsg(err.message));

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
        <Input placeholder="email" value={email} onChange={setEmail} />
        <Input
          placeholder="password"
          value={pass}
          onChange={setPass}
          password={true}
          onSubmit={signIn}
        />
      </View>

      <View style={{ width: 200 }}>
        <Button title="login" onPress={signIn} />
        {errMsg ? <Text style={{ color: 'red' }}>{errMsg}</Text> : null}
      </View>

      <View style={{ alignItems: 'center' }}>
        <Text>New user?</Text>
        <Link
          style={{ textDecorationLine: 'underline' }}
          href="/(auth)/sign-up"
        >
          Sign up
        </Link>
      </View>
    </View>
  );
};

export default SignIn;
