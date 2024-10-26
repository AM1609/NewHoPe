import { createStackNavigator } from "@react-navigation/stack";
import ServicesCustomer from '../screens/ServicesCustomer';
import { useMyContextProvider } from "../index";
import Appointments from "../screens/Appointments";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Image, Text } from "react-native";
import ChangePassword from "../screens/ChangePassword";
import Transaction from "../screens/Transaction";
import ProfileCustomer from "../screens/ProfileCustomer";
const Stack = createStackNavigator();

const RouterAppointment = ({ navigation }) => {
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;
    
    return (
        //đây là router của customer
        //thanh ở trên đầu của cus
        <Stack.Navigator
            initialRouteName="Appointments"
        >
            <Stack.Screen 
            name="Appointments" 
            component={Appointments} 
            options={{
                title: "Đơn hàng",
                headerLeft: null,
                headerStyle: { backgroundColor: 'orange' }, // Changed background color to orange
                headerTitleStyle: { 
                    // Changed title color to white
                    fontSize: 25, // Increased font size to 30
                    fontWeight: 'bold' // Made the font bold
                },
                headerRight: () => (
                    <TouchableOpacity onPress={() => navigation.navigate('Transaction')}>
                        <Image 
                            source={require('../assets/lsgiohang.png')} 
                            style={{ width: 70, height: 60,  }} 
                        /> 
                    </TouchableOpacity>
                ),
              }}
            />

            <Stack.Screen 
            name="Transaction" 
            component={Transaction} 
            options={{title:"Lịch sử đơn hàng" }}/>
        </Stack.Navigator>
    )
}

export default RouterAppointment;
