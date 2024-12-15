import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity,Image } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { createAccount } from '../index';
import colors from '../routers/colors'; // Import the colors module


const Register = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [disableCreate, setDisableCreate] = useState(true);

  const hasErrorFullName = () => fullName === "";
  const hasErrorEmail = () => !email.includes('@');
  const hasErrorPassword = () => password.length < 6;
  const hasErrorPasswordConfirm = () => confirmPassword !== password;
  const hasErrorPhone = () => {
    const phoneRegex = /^[0-9]{10}$/;  // Regex cho số điện thoại 10 số
    return !phoneRegex.test(phone);
  };
  const hasErrorAddress = () => address.trim() === '';

  useEffect(() => {
    setDisableCreate(
      hasErrorFullName() ||
      hasErrorEmail() ||
      hasErrorPassword() ||
      hasErrorPasswordConfirm() ||
      hasErrorPhone() ||
      hasErrorAddress()
    );
  }, [fullName, email, password, confirmPassword, phone, address]);

  const handleRegister = () => {
    createAccount(email, password, fullName, phone, address, role, navigation);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Đăng Ký</Text>
      <TextInput
        label={"Họ và tên"}
        value={fullName}
        onChangeText={setFullname}
        style={styles.input}
        mode="outlined"
        theme={{ colors: { primary: '#000' }, fonts: { regular: { fontSize: 18 } } }}
      />
      <HelperText style={styles.helperText} type='error' visible={hasErrorFullName()}>
        Full name không được phép để trống
      </HelperText>
      <TextInput
        label={"Email"}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        mode="outlined"
        theme={{ colors: { primary: '#000' }, fonts: { regular: { fontSize: 18 } } }}
      />
      <HelperText style={styles.helperText} type='error' visible={hasErrorEmail()}>
        Địa chỉ email không hợp lệ
      </HelperText>
      <View style={styles.passwordContainer}>
        <TextInput
          label={"Mật khẩu"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={styles.passwordInput}
          mode="outlined"
          theme={{ colors: { primary: '#000' }, fonts: { regular: { fontSize: 18 } } }}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.showPassword}>
          <Image
            source={showPassword ? require('../assets/eye.png') : require('../assets/eye-hidden.png')}
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>
      <HelperText style={styles.helperText} type='error' visible={hasErrorPassword()}>
        Password ít nhất 6 kí tự
      </HelperText>
      <View style={styles.passwordContainer}>
        <TextInput
          label={"Nhập lại mật khẩu"}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          style={styles.passwordInput}
          mode="outlined"
          theme={{ colors: { primary: '#000' }, fonts: { regular: { fontSize: 18 } } }}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.showPassword}>
          <Image
            source={showConfirmPassword ? require('../assets/eye.png') : require('../assets/eye-hidden.png')}
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>
      <HelperText style={styles.helperText} type='error' visible={hasErrorPasswordConfirm()}>
        Confirm Password phải giống với Password
      </HelperText>
      <TextInput
        label={"Địa chỉ"}
        value={address}
        onChangeText={setAddress}
        style={styles.input}
        mode="outlined"
        theme={{ colors: { primary: '#000' }, fonts: { regular: { fontSize: 18 } } }}
      />
      <HelperText style={styles.helperText} type='error' visible={hasErrorAddress()}>
        Địa chỉ không được để trống
      </HelperText>
      <TextInput
        label={"Điện thoại"}
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
        mode="outlined"
        keyboardType="phone-pad"
        theme={{ colors: { primary: '#000' }, fonts: { regular: { fontSize: 18 } } }}
      />
      <HelperText style={styles.helperText} type='error' visible={hasErrorPhone()}>
        Số điện thoại phải có 10 chữ số
      </HelperText>
      <Button
        mode='contained'
        onPress={handleRegister}
        disabled={disableCreate}
        style={styles.registerButton}
        labelStyle={styles.registerButtonText}
      >
        Tạo tài khoản
      </Button>
      <View style={styles.footer}>
        <Button onPress={() => navigation.navigate("Login")}>
          <Text style={styles.footerText}>Quay lại Đăng nhập</Text>
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  header: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  input: {
    marginBottom: 8,
    backgroundColor: "white",
    borderRadius: 8,
    height: 50,
  },
  elevatedInput: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  helperText: {
    marginLeft: 10,
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: "white",
  },
  showPassword: {
    marginLeft: 10,
  },
  eyeIcon: {
    width: 20,
    height: 20,
  },
  registerButton: {
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginBottom: 20,
  },
  registerButtonText: {
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

export default Register;
