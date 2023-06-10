module.exports = {
  root: true,
  extends: ['react-app', 'prettier', '@react-native-community'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': ['error', {endOfLine: 'auto'}],
  },
};
