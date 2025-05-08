import { auth } from '@/config';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';

const SignIn = () => {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  const [errMsg, setErrMsg] = useState('');

  const signIn = () =>
    signInWithEmailAndPassword(auth, email, pass)
      .then(() => router.navigate('/(tabs)'))
      .catch((err) => setErrMsg(err.message));

  return (
    <View>
      <TextInput placeholder="email" value={email} onChangeText={setEmail} />
      <TextInput
        placeholder="password"
        value={pass}
        onChangeText={setPass}
        onSubmitEditing={signIn}
      />
      <Button title="login" onPress={signIn} />
      {errMsg ? <Text style={{ color: 'red' }}>{errMsg}</Text> : null}
      <Link href="/(auth)/sign-up">Create account</Link>
    </View>
  );
};

export default SignIn;
