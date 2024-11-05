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

export default function PaymentOptionsScreen({ navigation, route }) {
  const { cartItems, totalAmount, userInfo, appointmentId, address } = route.params || {};
  const [controller] = useMyContextProvider();
  const { userLogin } = controller;
  const [lastTransactionId, setLastTransactionId] = useState(null);

  const handlePayment = async () => {
    const customerId = userInfo.email.split('@')[0];
    const timestamp = moment().format('YYMMDDHHmmss');
    const app_trans_id = `${timestamp}_${customerId}`;

    try {
      // Cập nhật trạng thái đơn hàng thành pending khi bắt đầu thanh toán
      const APPOINTMENTs = firestore().collection("Appointments");
      await APPOINTMENTs.doc(appointmentId).update({
        paymentMethod: "ZaloPay",
        transactionId: app_trans_id,
        state: "pending" // Cập nhật trạng thái thành pending
      });

      // Tiến hành thanh toán
      initiateZaloPayment(app_trans_id, totalAmount);
    } catch (error) {
      console.error("Error updating payment info: ", error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };

  const initiateZaloPayment = async (app_trans_id, totalAmount) => {
    try {
      // Prepare items for ZaloPay
      const items = cartItems.map(item => ({
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
      console.log('Transaction check result:', result);
      console.log('Return code:', result.return_code);

      // Chỉ cập nhật trạng thái khi người dùng bấm nút kiểm tra
      if (result.return_code === 1) {
        // Thanh toán thành công
        const APPOINTMENTs = firestore().collection("Appointments");
        await APPOINTMENTs.doc(appointmentId).update({
          state: 'delivering',
          paymentStatus: 'Payment successful'
        });

        Alert.alert(
          'Transaction Status', 
          'Thanh toán thành công!\n\nĐơn hàng của bạn đang được xử lý.', 
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Appointments')
            }
          ]
        );
      } else if (result.return_code === 2) {
        // Thanh toán thất bại
        const APPOINTMENTs = firestore().collection("Appointments");
        await APPOINTMENTs.doc(appointmentId).update({
          state: 'failed',
          paymentStatus: 'Payment failed'
        });

        Alert.alert(
          'Transaction Status',
          'Thanh toán thất bại!\n\nVui lòng thử lại.',
          [
            {
              text: 'OK'
            }
          ]
        );
      } else {
        // Đang xử lý hoặc trạng thái khác
        Alert.alert(
          'Transaction Status',
          'Đơn hàng đang được xử lý.\nVui lòng kiểm tra lại sau.',
          [
            {
              text: 'OK'
            }
          ]
        );
      }
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
