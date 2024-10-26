import { createStackNavigator } from "@react-navigation/stack";
import ServicesCustomer from '../screens/ServicesCustomer';
import { useMyContextProvider } from "../index";
import Appointment from "../screens/Appointment";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Image } from "react-native";
import ChangePassword from "../screens/ChangePassword";
import Appointments from "../screens/Appointments";
import OrderDetail from "../screens/OrderDetail";
import colors from '../screens/colors';
import Map from "../screens/Map"; // Import màn hình Map
import Payment from "../screens/Payment";
import PaymentZalo from "../screens/PaymentZalo";

const Stack = createStackNavigator();

const RouterServiceCustomer = ({ navigation }) => {
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;

    return (
        <Stack.Navigator
            initialRouteName="ServicesCustomer"
            screenOptions={{
                title: "Đặt hàng",
                headerTitleAlign: "left",
                headerStyle: {
                    backgroundColor: colors.background, // Use color from colors.js
                },
                headerRight: (props) => (
                    <TouchableOpacity onPress={() => navigation.navigate("ProfileCustomer")}>
                      <Image source={require('../assets/account.png')} style={{ width: 30, height: 30, margin: 20 }} />
                    </TouchableOpacity>
                  ),
            }}
        >
            <Stack.Screen name="ServicesCustomer" component={ServicesCustomer} options={{ title: userLogin ? userLogin.fullName : "Dịch vụ" }} />
            <Stack.Screen name="Appointments" component={Appointments} options={{ title: "Lịch hẹn" }} />
            <Stack.Screen 
                name="OrderDetail" 
                component={OrderDetail} 
                options={{ 
                    title: "Chi tiết đơn hàng", 
                    headerShown: true,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => navigation.navigate("Appointments")}>
                            <Image source={require('../assets/back.png')} style={{ width: 24, height: 24, marginLeft: 10 }} />
                        </TouchableOpacity>
                    ),
                }} 
            />
            <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ title: "Đổi mật khẩu" }} />
            <Stack.Screen name="Appointment" component={Appointment} options={{ title: "Đặt lịch" }} />
            <Stack.Screen name="Map" component={Map} options={{ title: "Bản đồ" }} />
            <Stack.Screen name="Payment" component={Payment} options={{ title: "Thanh toán" }} />
            <Stack.Screen name="PaymentZalo" component={PaymentZalo} options={{ title: "Thanh toán ZaloPay" }} />
        </Stack.Navigator>
    )
}

export default RouterServiceCustomer;
