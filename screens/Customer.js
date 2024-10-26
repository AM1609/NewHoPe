import React from "react";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import { createStackNavigator } from '@react-navigation/stack';
import RouterServiceCustomer from "../routers/RouterServiceCustomer";
import Appointments from "./Appointments";
import ProfileCustomer from "./ProfileCustomer";
import Cart from "./Cart";
import OrderDetail from "./OrderDetail";
import ChangePassword from "./ChangePassword";
import { Image } from "react-native";

const Tab = createMaterialBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    initialRouteName="RouterServiceCustomer"
    labeled={true}
    shifting={true}
  >
    <Tab.Screen
      name="RouterServiceCustomer"
      component={RouterServiceCustomer}
      options={{
        title: "Trang chủ",
        tabBarIcon: ({ color }) => (
          <Image
            source={require("../assets/home.png")}
            style={{ width: 24, height: 24, tintColor: color }}
          />
        ),
        tabBarOnPress: ({ navigation, defaultHandler }) => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'RouterServiceCustomer' }],
          });
          defaultHandler();
        },
      }}
    />
    <Tab.Screen
      name="Cart"
      component={Cart}
      options={{
        title: "Giỏ hàng",
        tabBarIcon: ({ color }) => (
          <Image
            source={require("../assets/Cart.png")}
            style={{ width: 24, height: 24, tintColor: color }}
          />
        ),
      }}
    />
    <Tab.Screen
      name="Appointments"
      component={Appointments}
      options={{
        title: "Đơn hàng",
        tabBarIcon: ({ color }) => (
          <Image
            source={require("../assets/appointment.png")}
            style={{ width: 24, height: 24, tintColor: color }}
          />
        ),
      }}
    />
    <Tab.Screen
      name="ProfileCustomer"
      component={ProfileCustomer}
      options={{
        title: "Hồ sơ",
        tabBarIcon: ({ color }) => (
          <Image
            source={require("../assets/customer.png")}
            style={{ width: 24, height: 24, tintColor: color }}
          />
        ),
      }}
    />
  </Tab.Navigator>
);

const Customer = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="MainTabs"
      component={TabNavigator}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="OrderDetail"
      component={OrderDetail}
      options={{ title: "Chi tiết đơn hàng" }}
    />
    <Stack.Screen
      name="ChangePassword"
      component={ChangePassword}
      options={{ title: "Đổi mật khẩu" }}
    />
    {/* Add more non-tabbed screens here if needed */}
  </Stack.Navigator>
);

export default Customer;
