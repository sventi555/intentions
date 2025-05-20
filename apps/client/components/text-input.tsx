import { TextInput } from 'react-native';

interface InputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  password?: boolean;
  onSubmit?: () => void;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  password,
  onSubmit,
}) => {
  return (
    <TextInput
      secureTextEntry={password}
      style={{
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 4,
        padding: 4,
        color: value ? 'black' : 'gray',
      }}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      onSubmitEditing={onSubmit}
    />
  );
};
