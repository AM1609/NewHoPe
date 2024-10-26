import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore'
import auth from '@react-native-firebase/auth'
import { MyContextControllerProvider } from './index';
import Router from './routers/Router';
import { MenuProvider } from 'react-native-popup-menu';
import { CartProvider } from './routers/CartContext';
const App = () => {
  //Create admin
  const USERS = firestore().collection("USERS")
  const admin = {
    fullName: "Admin",
    email: "admin@gmail.com",
    password: "123456",
    phone: "0912685449",
    address: "Bình Dương",
    role: "admin" 
  }
  useEffect(()=>{
    USERS.doc(admin.email)
    .onSnapshot(
      u => {
        if (!u.exists)
        {
          auth().createUserWithEmailAndPassword(admin.email, admin.password)
          .then(response =>
            {
              USERS.doc(admin.email).set(admin)
              console.log("Add new account admin")
            })
        }
      }
    )
  }, [])
  
  //Code show router
  return (
    <CartProvider>
      <MyContextControllerProvider>
        <MenuProvider>
          <NavigationContainer>
            <Router/>
          </NavigationContainer>
        </MenuProvider>
      </MyContextControllerProvider>
    </CartProvider>
  );
}
export default App
