import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Linking } from 'react-native';
import CryptoJS from 'crypto-js';
import moment from 'moment';
import { useCart } from '../routers/CartContext';
import { useMyContextProvider } from "../index"; // Import the context hook
import firestore from "@react-native-firebase/firestore";
import auth from '@react-native-firebase/auth';

// Cấu hình ứng dụng ZaloPay
const config = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "trMrHtvjo6myautxDUiAcYsVtaeQ8nhf",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  query_endpoint: "https://sb-openapi.zalopay.vn/v2/query"
};

// Thêm hàm format số
const formatCurrency = (amount) => {
  return amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function PaymentZalo({ navigation, route }) {
  // Debug logging
  console.log('Route params:', route.params);

  const { cartItems, totalAmount, userInfo, appointmentId } = route.params || {};
  const [controller] = useMyContextProvider();
  const { userLogin } = controller;
  const [lastTransactionId, setLastTransactionId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState({
    address: '',
    phoneNumber: ''
  });

  // Combine user information from different sources
  useEffect(() => {
    const user = userInfo || userLogin || auth().currentUser;
    console.log('Combined user info:', user);
    setCurrentUser(user);
  }, [userInfo, userLogin]);

  useLayoutEffect(() => {
    // Hide both tabBar and bottomBar
    const parent = navigation.getParent();
    parent?.setOptions({
      tabBarStyle: { display: 'none' },
      bottomBar: { display: 'none' }
    });
    
    // Cleanup function to restore the tabBar when leaving
    return () => {
      parent?.setOptions({
        tabBarStyle: { 
          height: 60,
          position: 'absolute',
          bottom: 16,
          right: 16,
          left: 16,
          borderRadius: 16
        }
      });
    };
  }, [navigation]);

  // Fetch user details from Firebase
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        if (appointmentId) {
          const appointmentDoc = await firestore()
            .collection('Appointments')
            .doc(appointmentId)
            .get();

          if (appointmentDoc.exists) {
            const appointmentData = appointmentDoc.data();
            console.log('Appointment data:', appointmentData);

            setUserDetails({
              address: appointmentData.address || 'Chưa có thông tin',
              phoneNumber: appointmentData.phone || 'Chưa có thông tin'
            });
          } else {
            console.log('Appointment not found');
          }
        }
      } catch (error) {
        console.error('Error fetching appointment details:', error);
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId]);

  // Thêm console.log để kiểm tra userDetails sau khi được set
  useEffect(() => {
    console.log('Current userDetails:', userDetails);
  }, [userDetails]);

  const handlePayment = async () => {
    console.log('Current user in handlePayment:', currentUser);
    console.log('Appointment ID:', appointmentId); // Debug log

    if (!currentUser?.email) {
        Alert.alert('Error', 'Vui lòng đăng nhập để tiếp tục');
        navigation.goBack();
        return;
    }

    if (!totalAmount) {
        Alert.alert('Error', 'Số tiền thanh toán không hợp lệ');
        return;
    }

    if (!appointmentId) {
        Alert.alert('Error', 'Không tìm thấy mã đơn hàng');
        return;
    }

    const customerId = currentUser.email.split('@')[0];
    const timestamp = moment().format('YYMMDDHHmmss');
    const app_trans_id = `${timestamp}_${customerId}`;

    try {
        // First check if the appointment exists
        const appointmentRef = firestore().collection("Appointments").doc(appointmentId);
        const appointmentDoc = await appointmentRef.get();

        if (!appointmentDoc.exists) {
            console.error('Appointment not found:', appointmentId);
            Alert.alert('Error', 'Không tìm thấy thông tin đơn hàng');
            return;
        }

        // If appointment exists, proceed with update
        await appointmentRef.update({
            paymentMethod: "ZaloPay",
            transactionId: app_trans_id,
            state: "pending",
            updatedAt: firestore.FieldValue.serverTimestamp()
        });

        console.log('Successfully updated appointment:', appointmentId);

        // Proceed with payment
        await initiateZaloPayment(app_trans_id, totalAmount);
    } catch (error) {
        console.error("Error updating payment info: ", error);
        
        // More specific error message based on error type
        if (error.code === 'firestore/not-found') {
            Alert.alert('Error', 'Không tìm thấy thông tin đơn hàng. Vui lòng thử lại.');
        } else {
            Alert.alert('Error', 'Không thể xử lý thanh toán. Vui lòng thử lại.');
        }
    }
};

  const initiateZaloPayment = async (app_trans_id, totalAmount) => {
    try {
        if (!currentUser?.email) {
            throw new Error('Thông tin người dùng không hợp lệ');
        }

        // Ensure totalAmount is a valid number and matches ZaloPay's requirements
        const amount = parseInt(totalAmount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Số tiền thanh toán không hợp lệ');
        }

        // Prepare items for ZaloPay
        const items = [{
            itemid: appointmentId,
            itemname: cartItems?.[0]?.title || 'Service Payment',
            itemprice: amount,
            itemquantity: 1
        }];

        // Format the order data according to ZaloPay's requirements
        const embedData = JSON.stringify({
            merchantinfo: "Beauty Service Payment",
            redirecturl: "https://yourdomain.com/redirect"
        });

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

        // Generate MAC (signature)
        const data = [
            config.app_id,
            order.app_trans_id,
            order.app_user,
            order.amount,
            order.app_time,
            order.embed_data,
            order.item
        ].join("|");

        order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

        console.log('Sending order to ZaloPay:', order);

        // Send payment request
        const response = await fetch(config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(order)
        });

        const responseData = await response.json();
        console.log('ZaloPay Response:', responseData);

        if (responseData.return_code === 1) {
            setLastTransactionId(app_trans_id);
            if (responseData.order_url) {
                await Linking.openURL(responseData.order_url);
                Alert.alert('Success', 'Đang chuyển đến trang thanh toán');
            } else {
                throw new Error('Không nhận được đường dẫn thanh toán');
            }
        } else {
            throw new Error(responseData.return_message || 'Giao dịch thất bại');
        }
    } catch (error) {
        console.error('Payment Error:', error);
        Alert.alert(
            'Error',
            'Không thể xử lý thanh toán: ' + (error.message || 'Vui lòng thử lại')
        );
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
          'Thanh toán thành công!\n\nĐơn hàng của bạn đang đợc xử lý.', 
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
      
      {/* Display Order Information */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderTitle}>Thông tin đơn hàng:</Text>
        <Text style={styles.orderText}>Số tiền: {formatCurrency(totalAmount)} VND</Text>
        <Text style={styles.orderText}>Mã đơn hàng: {appointmentId || 'N/A'}</Text>
        <Text style={styles.orderText}>Địa chỉ: {userDetails.address}</Text>
        <Text style={styles.orderText}>SĐT: {userDetails.phoneNumber}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePayment}>
        <Text style={styles.buttonText}>Thanh toán với ZaloPay</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={checkTransactionStatus}>
        <Text style={styles.buttonText}>Kiểm tra trạng thái giao dịch</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>Hủy</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  orderInfo: {
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  orderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 10,
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
  cancelButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
