import { createStackNavigator } from "@react-navigation/stack";
import ServicesCustomer from '../screens/ServicesCustomer';
import { useMyContextProvider } from "../index";
import Appointment from "../screens/Home";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Image } from "react-native";
import ChangePassword from "../screens/ChangePassword";
import Appointments from "../screens/Order";
import OrderDetail from "../screens/OrderDetail";
import colors from '../screens/colors';
import Map from "../screens/Map"; // Import màn hình Map
import Payment from "../screens/Payment";
import PaymentZalo from "../screens/PaymentZalo";
import DeliveryMap from "../screens/DeliveryMap";
import PaymentQR from "../screens/PaymentQR";   
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
                    backgroundColor: colors.background,
                },
                headerRight: (props) => (
                    <TouchableOpacity onPress={() => navigation.navigate("ProfileCustomer")}>
                      <Image source={require('../assets/account.png')} style={{ width: 30, height: 30, margin: 20 }} />
                    </TouchableOpacity>
                  ),
            }}
        >
            <Stack.Screen 
                name="ServicesCustomer" 
                component={ServicesCustomer} 
                options={{ title: userLogin ? userLogin.fullName : "Dịch vụ" }} 
            />
            <Stack.Screen 
                name="Appointments" 
                component={Appointments} 
                options={{ title: "Đặt Hàng" }} 
            />
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
            <Stack.Screen 
                name="ChangePassword" 
                component={ChangePassword} 
                options={{ title: "Đổi mật khẩu" }} 
            />
            <Stack.Screen 
                name="Appointment" 
                component={Appointment} 
                options={{ title: "Đặt lịch" }} 
            />
            <Stack.Screen 
                name="Map" 
                component={Map} 
                options={{ 
                    title: "Địa chỉ", 
                    headerShown: true,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => navigation.navigate("Cart")}>
                            <Image source={require('../assets/back.png')} style={{ width: 24, height: 24, marginLeft: 10 }} />
                        </TouchableOpacity>
                    ),
                    tabBarVisible: false,
                }} 
            />
            <Stack.Screen 
                name="PaymentQR" 
                component={PaymentQR}
                options={{
                    title: 'Thanh toán',
                    headerStyle: {
                        backgroundColor: '#FF6B00',
                    },
                    headerTintColor: '#fff',
                }}
            />
            <Stack.Screen 
                name="DeliveryMap" 
                component={DeliveryMap} 
                options={{ 
                    title: "Giao hàng", 
                    headerShown: true,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => navigation.navigate("Appointments")}>
                            <Image source={require('../assets/back.png')} style={{ width: 24, height: 24, marginLeft: 10 }} />
                        </TouchableOpacity>
                    ),
                    tabBarVisible: false,
                }} 
            />
            <Stack.Screen 
                name="Payment" 
                component={Payment} 
                options={{ title: "Thanh toán" }} 
            />
            <Stack.Screen 
                name="PaymentZalo" 
                component={PaymentZalo} 
                options={{ 
                    title: "Thanh toán ZaloPay", 
                    headerShown: true,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => navigation.navigate("Cart")}>
                            <Image source={require('../assets/back.png')} style={{ width: 24, height: 24, marginLeft: 10 }} />
                        </TouchableOpacity>
                    ),
                    tabBarVisible: false,
                    tabBarStyle: { display: 'none' },
                    tabBarButton: () => null,
                }} 
            />
        </Stack.Navigator>
    )
}

export default RouterServiceCustomer;
