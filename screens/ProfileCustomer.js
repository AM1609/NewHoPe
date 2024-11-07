import React,{useEffect} from "react";
import { Text } from "react-native-paper";
import { View, StyleSheet,Button, TouchableOpacity } from "react-native";
import {logout, useMyContextProvider } from "../index";
import { NavigationContainer } from "@react-navigation/native";
import colors from '../routers/colors';

const ProfileCustomer = ({navigation}) =>{
    const [controller, dispatch] = useMyContextProvider();
    const { userLogin } = controller;
    
    useEffect(()=>{
        if(!userLogin){
            navigation.navigate('Login');
            return;
        }
    }, [userLogin, navigation]);

    if (!userLogin) {
        return null;
    }

    const handleLogout = async () => {
        try {
            await logout(dispatch);
            navigation.navigate('Login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };
    const handleEdit = () => {
        navigation.navigate("ChangePassword");
    };
    return(
        <View style={styles.container}>
            <Text style={styles.header}>Hồ sơ</Text>
            
            <View style={styles.profileCard}>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{userLogin.email}</Text>
                </View>
                
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Tên:</Text>
                    <Text style={styles.value}>{userLogin.fullName}</Text>
                </View>
                
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Địa chỉ:</Text>
                    <Text style={styles.value}>{userLogin.address}</Text>
                </View>
                
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Điện thoại:</Text>
                    <Text style={styles.value}>{userLogin.phone}</Text>
                </View>
                
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Cấp bậc:</Text>
                    <Text style={styles.value}>
                        {userLogin.role === "customer" ? "Khách hàng" : "Nhân viên"}
                    </Text>
                </View>
            </View>
            
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.button, styles.changePasswordButton]}
                    onPress={handleEdit}
                >
                    <Text style={styles.buttonText}>Đổi mật khẩu</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.button, styles.logoutButton]}
                    onPress={handleLogout}
                >
                    <Text style={styles.buttonText}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    
    header: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        backgroundColor: colors.primary,
        padding: 20,
        textAlign: 'center',
        elevation: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    
    profileCard: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    
    infoRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    
    label: {
        flex: 1,
        fontSize: 16,
        color: '#757575',
        fontWeight: '500',
    },
    
    value: {
        flex: 2,
        fontSize: 16,
        color: '#212121',
        fontWeight: '400',
    },
    
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        padding: 16,
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
    },
    
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        elevation: 3,
        minWidth: 140,
    },
    
    changePasswordButton: {
        backgroundColor: colors.primary,
    },
    
    logoutButton: {
        backgroundColor: '#FF3B30',
    },
    
    buttonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
});

export default ProfileCustomer;
