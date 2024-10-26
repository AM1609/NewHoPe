import { StyleSheet, Text, TouchableOpacity, View, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { TextInput, HelperText } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import {logout,  useMyContextProvider } from '../../store';

const ChangePassword = () => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigation = useNavigation();

  const hasErrorPass = () => newPassword.length < 6;
  const passwordsMatch = () => newPassword === confirmPassword;

  const reauthenticate = () => {
    const user = auth().currentUser;
    const credential = auth.EmailAuthProvider.credential(user.email, currentPass);
    return user.reauthenticateWithCredential(credential);
  };
  
  const handleChangePassword = async () => {
    if (!passwordsMatch()) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
      return;
    }

    try {
      const user = auth().currentUser;
      
      if (!user) {
        Alert.alert('Lỗi', 'Người dùng hiện tại không tồn tại');
        return;
      }
      await reauthenticate();
      await user.updatePassword(newPassword);
      firestore()
        .collection('USERS')
        .doc(user.email)
        .update({password: newPassword})
        .then(() => {
          console.log("Customer updated successfully!");
        })
        .catch(error => {
          console.error("Error updating customer:", error);
        });
      Alert.alert('Thành công', 'Cập nhật mật khẩu thành công, vui lòng đăng nhập lại');
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert('Lỗi', 'Đổi mật khẩu thất bại');
    }
  };
  
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Đổi mật khẩu</Text>
        
        <TextInput
          style={styles.input}
          label="Mật khẩu hiện tại"
          value={currentPass}
          onChangeText={setCurrentPass}
          secureTextEntry
          mode="outlined"
        />

        <TextInput
          style={styles.input}
          label="Mật khẩu mới"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          mode="outlined"
        />
        
        <TextInput
          style={styles.input}
          label="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          mode="outlined"
        />
        
        <HelperText type="error" visible={hasErrorPass()}>
          Mật khẩu mới phải từ 6 kí tự trở lên
        </HelperText>

        <HelperText type="error" visible={!passwordsMatch() && confirmPassword !== ''}>
          Mật khẩu mới không khớp
        </HelperText>

        <TouchableOpacity 
          style={[
            styles.button,
            (hasErrorPass() || !passwordsMatch()) && styles.buttonDisabled
          ]}
          onPress={handleChangePassword}
          disabled={hasErrorPass() || !passwordsMatch()}
        >
          <Text style={styles.buttonText}>Đổi mật khẩu</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ChangePassword;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "white",
    justifyContent: 'center',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    backgroundColor: 'orange',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: 'gray',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
