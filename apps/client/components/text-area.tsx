import { TextInput } from 'react-native';

interface TextAreaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  numberOfLines?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  placeholder,
  numberOfLines,
}) => {
  return (
    <TextInput
      style={{
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 4,
        padding: 4,
        color: 'black',
      }}
      placeholderTextColor="gray"
      numberOfLines={numberOfLines}
      multiline
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
    />
  );
};
