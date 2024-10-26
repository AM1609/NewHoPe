import React, { useEffect, useState } from 'react';
import { Image, View, TouchableOpacity, StyleSheet } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useMyContextProvider, login } from '../index';
import colors from '../screens/colors';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [controller, dispatch] = useMyContextProvider();
  const { userLogin } = controller;
  const [showPassword, setShowPassword] = useState(false);
  const [disableLogin, setDisableLogin] = useState(true);

  const hasErrorEmail = () => emailTouched && !email.includes("@");
  const hasErrorPassword = () => passwordTouched && password.length < 6;

  useEffect(() => {
    setDisableLogin(email.trim() === '' || password.trim() === '' || hasErrorEmail() || hasErrorPassword());
  }, [email, password, emailTouched, passwordTouched]);

  const handleLogin = () => {
    login(dispatch, email, password);
  };

  useEffect(() => {
    if (userLogin != null) {
      if (userLogin.role === "admin")
        navigation.navigate("Admin");
      else if (userLogin.role === "customer")
        navigation.navigate("Customer");
    }
  }, [userLogin]);

  return (
    <View style={styles.container}>
      <Image source={require("../assets/transcend_icon.png")} style={styles.logo} />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        onBlur={() => setEmailTouched(true)}
        style={styles.input}
        mode="outlined"
        theme={{ 
          colors: { primary: '#000' },
          fonts: { regular: { fontSize: 18 } }
        }}
      />
      <HelperText type='error' visible={hasErrorEmail()} style={styles.helperText}>
        Địa chỉ Email không hợp lệ
      </HelperText>
      <TextInput
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        onBlur={() => setPasswordTouched(true)}
        secureTextEntry={!showPassword}
        style={styles.input}
        mode="outlined"
        theme={{ colors: { primary: '#000' }, fonts: { regular: { fontSize: 18 } } }}
      />
      <HelperText type='error' visible={hasErrorPassword()} style={styles.helperText}>
        Password có ít nhất 6 ký tự
      </HelperText>
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPassword}>
        <Image
          source={showPassword ? require('../assets/eye.png') : require('../assets/eye-hidden.png')}
          style={styles.eyeIcon}
        />
        <Text style={styles.showPasswordText}>Hiển thị mật khẩu</Text>
      </TouchableOpacity>
      <Button
        mode='contained'
        onPress={handleLogin}
        disabled={disableLogin}
        style={styles.loginButton}
        labelStyle={styles.loginButtonText}
      >
        Đăng nhập
      </Button>
      <View style={styles.footer}>
        <Button onPress={() => navigation.navigate("Register")}>
          <Text style={styles.footerText}>Tạo tài khoản</Text>
        </Button>
        <Button onPress={() => navigation.navigate("ForgotPassword")}>
          <Text style={styles.footerText}>Quên mật khẩu</Text>
        </Button>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  logo: {
    alignSelf: "center",
    marginBottom: 40,
    width: 200, // Increase width
    height: 200, // Increase height
  },
  input: {
    marginBottom: 10,
    backgroundColor: "white",
  },
  helperText: {
    marginLeft: 10,
    fontSize: 15,
  },
  showPassword: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 20,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  showPasswordText: {
    fontSize: 16,
    color: colors.text,
  },
  loginButton: {
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 18,
    color: '#fff',
    marginHorizontal: 20,
  },
});
