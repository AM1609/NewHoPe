import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Linking } from 'react-native';
import CryptoJS from 'crypto-js';
import moment from 'moment';
import { useCart } from '../routers/CartContext';
import { useMyContextProvider } from "../index"; // Import the context hook
import firestore from "@react-native-firebase/firestore";

// Cấu hình ứng dụng ZaloPay
const config = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  query_endpoint: "https://sb-openapi.zalopay.vn/v2/query"
};

export default function PaymentOptionsScreen({ navigation }) {
  const { cart } = useCart();
  const [controller] = useMyContextProvider();
  const { userLogin } = controller;
  const [lastTransactionId, setLastTransactionId] = useState(null);

  const handlePayment = async () => {
    // Generate app_trans_id using customer ID and timestamp
    const customerId = userLogin.email.split('@')[0];
    const timestamp = moment().format('YYMMDDHHmmss');
    const app_trans_id = `${timestamp}_${customerId}`;

    // Add order to Firebase immediately
    const APPOINTMENTs = firestore().collection("Appointments");
    const services = cart.map(item => ({
      title: item.title,
      quantity: item.quantity,
      options: item.options
    }));

    const totalAmount = cart.reduce((total, item) => {
      return total + (item.price * item.quantity) + 
        (item.options ? item.options.reduce((optionTotal, option) => optionTotal + (option.price * item.quantity), 0) : 0);
    }, 0);

    APPOINTMENTs.add({
      email: userLogin.email,
      fullName: userLogin.fullName,
      services,
      totalPrice: totalAmount,
      phone: userLogin.phone,
      address: userLogin.address, // Add the user's address here
      datetime: new Date(),
      state: "new",
      paymentMethod: "ZaloPay",
      transactionId: app_trans_id
    }).then(docRef => {
      APPOINTMENTs.doc(docRef.id).update({ id: docRef.id });
      console.log("Order added to Firebase with ID: ", docRef.id);
      
      // Proceed with ZaloPay payment process
      initiateZaloPayment(app_trans_id, totalAmount);
    }).catch(error => {
      console.error("Error adding order to Firebase: ", error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    });
  };

  const initiateZaloPayment = async (app_trans_id, totalAmount) => {
    try {
      // Prepare items for ZaloPay
      const items = cart.map(item => ({
        itemid: item.id,
        itemname: item.title,
        itemprice: item.price,
        itemquantity: item.quantity
      }));

      const order = {
        app_id: 2553,
        app_user: userLogin.email.split('@')[0],
        app_trans_id: app_trans_id,
        app_time: Date.now(),
        amount: totalAmount,
        item: JSON.stringify(items),
        description: 'Thanh toán đơn hàng #' + app_trans_id,
        embed_data: JSON.stringify({ promotioninfo: "", merchantinfo: "du lieu rieng cua ung dung" }),
        bank_code: "zalopayapp",
        callback_url: "https://yourdomain.com/callback",
        mac: ""
      };

      // Tạo chữ ký HMAC
      const data = `${config.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
      order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

      console.log('Order Data:', order);

      // Gửi yêu cầu thanh toán bằng fetch
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });

      const responseData = await response.json();
      console.log('Response Data:', responseData);

      if (responseData.return_code === 1) {
        setLastTransactionId(app_trans_id);
        if (responseData.order_url) {
          await Linking.openURL(responseData.order_url);
          Alert.alert('Success', 'Payment page opened in browser.');
        } else {
          Alert.alert('Error', 'Payment URL not provided');
        }
      } else {
        Alert.alert('Error', 'Payment initiation failed!');
      }
    } catch (error) {
      console.error('Payment Error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An unknown error occurred.');
    }
  };

  const checkTransactionStatus = async () => {
    if (!lastTransactionId) {
      Alert.alert('Error', 'No recent transaction to check.');
      return;
    }

    try {
      const data = `${config.app_id}|${lastTransactionId}|${config.key1}`;
      const mac = CryptoJS.HmacSHA256(data, config.key1).toString();

      const response = await fetch(config.query_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `app_id=${config.app_id}&app_trans_id=${lastTransactionId}&mac=${mac}`,
      });

      const result = await response.json();

      let statusMessage = '';
      switch(result.return_code) {
        case 1:
          statusMessage = 'Payment successful';
          break;
        case 2:
          statusMessage = 'Payment failed';
          break;
        case 3:
          statusMessage = 'Payment pending or processing';
          break;
        default:
          statusMessage = 'Unknown status';
      }

      Alert.alert('Transaction Status', `${statusMessage}\n\nDetails: ${result.return_message}`);
    } catch (error) {
      console.error('Status Check Error:', error);
      Alert.alert('Error', 'Failed to check transaction status.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn phương thức thanh toán</Text>
      <TouchableOpacity style={styles.button} onPress={handlePayment}>
        <Text style={styles.buttonText}>Thanh toán với ZaloPay</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={checkTransactionStatus}>
        <Text style={styles.buttonText}>Kiểm tra trạng thái giao dịch</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Hủy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
