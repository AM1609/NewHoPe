import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import firestore from "@react-native-firebase/firestore";
import colors from '../screens/colors'; // Ensure you import the colors module

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [disableGetPassword, setDisableGetPassword] = useState(true);

  const hasErrorEmail = () => !email.includes('@');

  const handleGetPassword = () => {
    firestore()
      .collection('USERS')
      .doc(email)
      .get()
      .then((documentSnapshot) => {
        if (documentSnapshot.exists) {
          const userData = documentSnapshot.data();
          setPassword(userData.password);
          setError('');
        } else {
          setPassword('');
          setError('Email không tồn tại trong hệ thống.');
        }
      })
      .catch((error) => {
        console.error("Error fetching document: ", error);
        setPassword('');
        setError('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
      });
  };
  useEffect(() => {
    setDisableGetPassword(email.trim() === '' || !!error || hasErrorEmail());
  }, [email, error, hasErrorEmail]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Forgot Password</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.textInput}
        mode="outlined"
        theme={{ 
          colors: { primary: '#000' },
          fonts: { regular: { fontSize: 18 } }
        }}
      />
      <HelperText type="error" visible={hasErrorEmail()} style={styles.helperText}>
        Địa chỉ email không hợp lệ
      </HelperText>
      {password ? (
        <View style={styles.passwordContainer}>
          <Text style={styles.passwordLabel}>Your Password: </Text>
          <Text style={styles.passwordText}>{password}</Text>
        </View>
      ) : null}
      <Button
        style={styles.button}
        mode="contained"
        onPress={handleGetPassword}
        disabled={disableGetPassword}
        labelStyle={styles.buttonText}
      >
        Get Password
      </Button>
      <Button
        onPress={() => navigation.navigate("Login")}
        style={styles.backButton}
        labelStyle={styles.backButtonLabel}
      >
        Back to Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
    justifyContent: "center",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    alignSelf: "center",
    color: "#fff",
    marginBottom: 40,
  },
  textInput: {
    marginBottom: 10,
    backgroundColor: "white",
  },
  helperText: {
    marginLeft: 10,
    fontSize: 15,
    color: "#fff",
  },
  passwordContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  passwordLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#fff",
  },
  passwordText: {
    fontSize: 18,
    color: "#fff",
  },
  button: {
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginBottom: 20, // Add margin for spacing
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonLabel: {
    color: "#fff",
  },
});

export default ForgotPassword;
