import React,{useEffect} from "react";
import { Text } from "react-native-paper";
import { View, StyleSheet,Button } from "react-native";
import {logout, useMyContextProvider } from "../index";
import { NavigationContainer } from "@react-navigation/native";
import colors from '../screens/colors';

const ProfileCustomer = ({navigation}) =>{
    const [controller, dispatch] = useMyContextProvider();
    const { userLogin } = controller;
    
    useEffect(()=>{
        if(userLogin==null)
            navigation.navigate('Login')
    }, [userLogin])

    const handleLogout = () => {
        logout(dispatch);
    };
    const handleEdit = () => {
        navigation.navigate("ChangePassword");
    };
    return(
        <View style={styles.container}>
            <Text style={[styles.header, { color: '#fff' }]}>Hồ sơ</Text>
            <View style={styles.contentContainer}>
                {userLogin !== null && (
                    <>
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Email: </Text>
                                <Text style={styles.value}>{userLogin.email}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Tên: </Text>
                                <Text style={styles.value}>{userLogin.fullName}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Địa chỉ: </Text>
                                <Text style={styles.value}>{userLogin.address}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Điện thoại: </Text>
                                <Text style={styles.value}>{userLogin.phone}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Cấp bậc: </Text>
                                <Text style={styles.value}>
                                    {userLogin.role === "customer" ? "Khách hàng" : userLogin.role}
                                </Text>
                            </View>
                        </View>
                    </>
                )}
            </View>
            <View style={styles.buttonContainer}>
                <View style={styles.buttonRow}>
                    <Button
                        color={"orange"}
                        mode="contained"
                        onPress={handleEdit}
                        title="Đổi mật khẩu"
                        style={styles.button}
                    />
                    <Button
                        color={"red"}
                        mode="contained"
                        onPress={handleLogout}
                        title="Đăng xuất"
                        style={styles.button}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: "white",
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    header: {
        padding: 15,
        fontSize: 25,
        fontWeight: 'bold',
        backgroundColor: colors.background, // Use color from colors.js
        textAlign: 'center', // Center the text
    },
    infoCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        paddingVertical: 5,
    },
    label: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    value: {
        fontSize: 18,
        color: '#555',
        flex: 2,
    },
    buttonContainer: {
        padding: 20,
        alignItems: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%', // Adjust width as needed
    },
    button: {
        flex: 1,
        marginHorizontal: 5, // Add margin between buttons
        borderRadius: 5,
    },
});

export default ProfileCustomer;
