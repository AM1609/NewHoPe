import { createStackNavigator } from "@react-navigation/stack";
import ServicesCustomer from '../screens/ServicesCustomer';
import { useMyContextProvider } from "../index";
import Appointment from "../screens/Appointment";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Image, Text } from "react-native";
import ChangePassword from "../screens/ChangePassword";
import Transaction from "../screens/Transaction";
import ProfileCustomer from "../screens/ProfileCustomer";
import { Icon } from "react-native-paper";
const Stack = createStackNavigator();

const RouterProfile = ({ navigation }) => {
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;
    
    return (
        //đây là router của customer
        //thanh ở trên đầu của cus
        <Stack.Navigator
            initialRouteName="ProfileCustomer"
        >
            <Stack.Screen 
            name="ProfileCustomer" 
            component={ProfileCustomer} 
            options={{
                title: "Hồ sơ khách hàng",
                headerLeft: null,
                headerStyle: { backgroundColor: 'orange' }, // Changed background color to orange
                headerTitleStyle: { 
                    
                    fontSize: 25, // Increased font size to 30
                    fontWeight: 'bold' // Made the font bold
                },}}
            />
            <Stack.Screen 
            name="ChangePassword" 
            component={ChangePassword} 
            options={{
                title: "Đổi mật khẩu",
                headerStyle: { backgroundColor: 'orange' },
                headerTitleStyle: { 
                    color: 'white', // Changed title color to white
                    fontSize: 25, // Increased font size to 30
                    fontWeight: 'bold' // Made the font bold
                },
                
            }}
            />
        </Stack.Navigator>
    )
}

export default RouterProfile;
