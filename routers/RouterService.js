import { createStackNavigator } from "@react-navigation/stack";
import Services from '../admin/Services';
import AddNewService from '../admin/AddNewService';
import ServiceDetail from '../admin/ServiceDetail';
import ServiceUpdate from "../admin/ServiceUpdate";
import { useMyContextProvider } from "../index";
import { Text, IconButton } from "react-native-paper";
import { Menu, MenuTrigger, MenuOption, MenuOptions } from "react-native-popup-menu";
import { Alert, Image } from "react-native";
import firestore from '@react-native-firebase/firestore';
import { TouchableOpacity } from "react-native-gesture-handler";
import ChangePasswordad from "../admin/ChangePasswordad";

const Stack = createStackNavigator();

const RouterService = ({ navigation }) => {
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;

    const handleDelete = (service) => {
        Alert.alert(
            "Cảnh báo!",
            "Bạn có chắc muốn xóa sản phẩm?",
            [
                {
                    text: "Trở lại",
                    style: "cancel"
                },
                {
                    text: "Xóa",
                    onPress: () => {
                        firestore()
                            .collection('Services')
                            .doc(service.id)
                            .delete()
                            .then(() => {
                                console.log("Dịch vụ đã được xóa thành công!");
                                navigation.navigate("Services");
                            })
                            .catch(error => {
                                console.error("Lỗi khi xóa dịch vụ:", error);
                            });
                    },
                    style: "default"
                }
            ]
        );
    };

    return (
        <Stack.Navigator
            initialRouteName="Services"
            screenOptions={{
                headerTitleAlign: "left",
                headerStyle: {
                    backgroundColor: "orange"
                },
                headerRight: (props) => (
                    <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                      <Image source={require('../assets/account.png')} style={{ width: 30, height: 30, margin: 20 }} />
                    </TouchableOpacity>
                  ),
                  
            }}
            >
            <Stack.Screen 
            name="ChangePasswordad" 
            component={ChangePasswordad} 
            options={({ route }) => ({title:"Đổi thông tin" })}
            />
            <Stack.Screen 
            options={{headerLeft: null, title: (userLogin != null) && (userLogin.fullName)}} 
            name="Services" component={Services} />
            <Stack.Screen 
            name="AddNewService" 
            component={AddNewService} 
            options={({ route }) => ({title:"Thêm mới sản phẩm" })}
            />
            <Stack.Screen
                name="ServiceDetail"
                component={ServiceDetail}
                options={({ route }) => ({
                    title: "Chi tiết sản phẩm",
                    headerRight: () => (
                        <Menu>
                            <MenuTrigger>
                            <Image source={require('../assets/dots.png')} style={{ width: 30, height: 30, margin: 20 }} />
                            </MenuTrigger>
                            <MenuOptions>
                                <MenuOption onSelect={() => navigation.navigate("ServiceUpdate", { service: route.params.service })}>
                                    <Text>Cập nhật</Text>
                                </MenuOption>
                                <MenuOption onSelect={() => handleDelete(route.params.service)}>
                                    <Text>Xóa</Text>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                    )
                })}
            />
            <Stack.Screen name="ServiceUpdate" component={ServiceUpdate} options={({ route }) => ({
                    title: "Cập nhật sản phẩm" })}/>
        </Stack.Navigator>
    )
}

export default RouterService;
