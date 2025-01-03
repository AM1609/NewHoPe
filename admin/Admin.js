import React from "react";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import RouterService from "../routers/RouterService";
import Transaction from "../routers/Transaction";

import Customers from "./Customers";

import Profile from "./Profile";
import { Image } from "react-native";
import Appointadmin from "./Appointadmin";

const Tab = createMaterialBottomTabNavigator();

const Admin = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="RouterService"
        component={RouterService}
        initialRouteName="RouterService"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../assets/home.png")}
              style={{ width: 24, height: 24, tintColor: color }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Appointadmin"
        component={Appointadmin}
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
        name="Customers"
        component={Customers}
        options={{
          title: "Khách hàng",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../assets/customer.png")}
              style={{ width: 24, height: 24, tintColor: color }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          title: "Hồ sơ",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("../assets/account.png")}
              style={{ width: 24, height: 24, tintColor: color }}
            />
          ),
        }}
      />
      
    </Tab.Navigator>
  );
};

export default Admin;
