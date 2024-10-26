import React,{useEffect} from "react";
import { Text } from "react-native-paper";
import { View, StyleSheet, Button } from "react-native";
import {logout, useMyContextProvider } from "../index";
import ChangePassword from "./ChangePasswordad";

const Profile = ({navigation}) =>{
    const [controller, dispatch] = useMyContextProvider();
    const { userLogin } = controller;
    
    useEffect(()=>{
        if(userLogin==null)
            navigation.navigate("Login")
    }, [userLogin])

    const handleLogout = () => {
        logout(dispatch);
    };
    const handleEdit = () => {
        navigation.navigate("ChangePasswordad");
    };
    return(
        <View>
            <Text style={{backgroundColor:"orange", padding: 15, fontSize: 25, fontWeight: "bold" }}>Hồ sơ</Text>
            {userLogin !== null && (
                <View style={{ flexDirection: 'row', padding: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Email: </Text>
                    <Text style={{ fontSize: 20}}>{userLogin.email}</Text>
                </View>
            )}
            {userLogin !== null && (
                <View style={{ flexDirection: 'row', padding: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Mật khẩu: </Text>
                    <Text style={{ fontSize: 20}}>{userLogin.password}</Text>
                </View>
            )}
            {userLogin !== null && (
                <View style={{ flexDirection: 'row', padding: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Tên: </Text>
                    <Text style={{ fontSize: 20}}>{userLogin.fullName}</Text>
                </View>
            )}
            {userLogin !== null && (
                <View style={{ flexDirection: 'row', padding: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Địa chỉ: </Text>
                    <Text style={{ fontSize: 20}}>{userLogin.address}</Text>
                </View>
            )}
            {userLogin !== null && (
                <View style={{ flexDirection: 'row', padding: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Điện thoại: </Text>
                    <Text style={{ fontSize: 20}}>{userLogin.phone}</Text>
                </View>
            )}
            {userLogin !== null && (
                <View style={{ flexDirection: 'row', padding: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Cấp bậc: </Text>
                    <Text style={{ fontSize: 20}}>{userLogin.role}</Text>
                </View>
            )}
            <View style={{ paddingLeft:40, paddingRight:40, paddingTop:250}}>
            <Button
                color={"orange"}
                textColor="#000000"
                mode="contained"
                
                onPress={() => handleEdit(userLogin)}
                title="Chỉnh sửa hồ sơ"
            >
            </Button>
            </View>
            <View style={{ paddingLeft:40, paddingRight:40, paddingTop:20}}>
            <Button
                color={"orange"}
                textColor="#000000"
                mode="contained"
                onPress={handleLogout}
                title="Đăng xuất"
            >
            </Button>
            </View>
            
        </View>
    )
}
export default Profile;
