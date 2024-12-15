import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Linking, Modal, TextInput } from 'react-native';
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

  const { appointmentId } = route.params || {};
  const [controller] = useMyContextProvider();
  const { userLogin } = controller;
  const [lastTransactionId, setLastTransactionId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState({
    totalAmount: 0,
    address: '',
    phoneNumber: '',
    services: [],
    email: '',
    fullName: ''
  });
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editedFullName, setEditedFullName] = useState('');
  const [editedPhoneNumber, setEditedPhoneNumber] = useState('');

  // Fetch appointment details from Firebase
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        if (appointmentId) {
          const appointmentDoc = await firestore()
            .collection('Appointments')
            .doc(appointmentId)
            .get();

          if (appointmentDoc.exists) {
            const data = appointmentDoc.data();
            setAppointmentDetails({
              totalAmount: data.discountValue || 0,
              address: data.address || 'Chưa có thông tin',
              phoneNumber: data.phone || 'Chưa có thông tin',
              services: data.services || [],
              email: data.email || '',
              fullName: data.fullName || 'Khách hàng'
            });
            
            // Set current user based on appointment email
            if (data.email) {
              setCurrentUser({ email: data.email });
            }
          } else {
            console.log('Appointment not found');
            Alert.alert('Lỗi', 'Không tìm thấy thông tin đơn hàng');
            navigation.goBack();
          }
        }
      } catch (error) {
        console.error('Error fetching appointment details:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin đơn hàng');
      }
    };

    fetchAppointmentDetails();
  }, [appointmentId]);

  useLayoutEffect(() => {
    // Ẩn navigation bar
    navigation.getParent()?.setOptions({
      tabBarStyle: {
        display: 'none'
      }
    });

    // Cleanup function để khôi phục navigation bar khi rời khỏi màn hình
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          display: 'flex',
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

  // Thêm console.log để kiểm tra userDetails sau khi được set
  useEffect(() => {
    console.log('Current userDetails:', appointmentDetails);
  }, [appointmentDetails]);

  const handlePayment = async () => {
    console.log('Current user in handlePayment:', currentUser);
    console.log('Appointment ID:', appointmentId); // Debug log

    if (!currentUser?.email) {
        Alert.alert('Error', 'Vui lòng đăng nhập để tiếp tục');
        navigation.goBack();
        return;
    }

    if (!appointmentDetails.totalAmount) {
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
        await initiateZaloPayment(app_trans_id, appointmentDetails.totalAmount);
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
            itemname: appointmentDetails.services?.[0]?.title || 'Service Payment',
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
          state: 'preparing',
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

  const handleUpdateInfo = async () => {
    try {
      if (!editedFullName.trim() || !editedPhoneNumber.trim()) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
        return;
      }

      await firestore()
        .collection('Appointments')
        .doc(appointmentId)
        .update({
          fullName: editedFullName,
          phone: editedPhoneNumber,
        });

      setAppointmentDetails(prev => ({
        ...prev,
        fullName: editedFullName,
        phoneNumber: editedPhoneNumber,
      }));

      setIsEditModalVisible(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin nhận hàng');
    } catch (error) {
      console.error('Error updating info:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật thông tin. Vui lòng thử lại');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thanh toán với ZaloPay</Text>
      
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Thông tin đơn hàng</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              setEditedFullName(appointmentDetails.fullName);
              setEditedPhoneNumber(appointmentDetails.phoneNumber);
              setIsEditModalVisible(true);
            }}
          >
            <Text style={styles.editButtonText}>Sửa thông tin</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Khách hàng:</Text>
          <Text style={styles.value}>{appointmentDetails.fullName}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Số tiền:</Text>
          <Text style={styles.amount}>{formatCurrency(appointmentDetails.totalAmount)} VNĐ</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Địa chỉ:</Text>
          <Text style={styles.value}>{appointmentDetails.address}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Số điện thoại:</Text>
          <Text style={styles.value}>{appointmentDetails.phoneNumber}</Text>
        </View>
      </View>

      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sửa thông tin nhận hàng</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Họ tên:</Text>
              <TextInput
                style={styles.input}
                value={editedFullName}
                onChangeText={setEditedFullName}
                placeholder="Nhập họ tên"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Số điện thoại:</Text>
              <TextInput
                style={styles.input}
                value={editedPhoneNumber}
                onChangeText={setEditedPhoneNumber}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.buttonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateInfo}
              >
                <Text style={styles.buttonText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={handlePayment}
        >
          <Text style={styles.buttonText}>Thanh toán với ZaloPay</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={checkTransactionStatus}
        >
          <Text style={styles.buttonText}>Kiểm tra trạng thái giao dịch</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A237E',
    marginBottom: 24,
    textAlign: 'center',
  },
  
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  
  label: {
    fontSize: 16,
    color: '#546E7A',
    flex: 1,
  },
  
  value: {
    fontSize: 16,
    color: '#37474F',
    flex: 2,
    textAlign: 'right',
  },
  
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976D2',
    flex: 2,
    textAlign: 'right',
  },
  
  buttonContainer: {
    gap: 12,
    marginTop: 'auto',
    marginBottom: 20,
  },
  
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  
  secondaryButton: {
    backgroundColor: '#1976D2',
  },
  
  cancelButton: {
    backgroundColor: '#FF4444',
  },
  
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 20,
    textAlign: 'center',
  },

  inputContainer: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 16,
    color: '#546E7A',
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },

  saveButton: {
    backgroundColor: '#2196F3',
  },

  cancelButton: {
    backgroundColor: '#FF4444',
  },
});
