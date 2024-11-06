import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore';

const PaymentQR = ({ route, navigation }) => {
    const { orderId, amount, userInfo } = route.params;
    const [qrImage, setQrImage] = useState(null);

    useEffect(() => {
        generateQR();
    }, [amount]);

    const generateQR = async () => {
        try {
            const response = await fetch('https://api.vietqr.io/v2/generate', {
                method: 'POST',
                headers: {
                    'x-client-id': 'YOUR_CLIENT_ID', // Thay thế bằng client ID của bạn
                    'x-api-key': 'YOUR_API_KEY',     // Thay thế bằng API key của bạn
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accountNo: "0911287414",       // Thay thế bằng số tài khoản của bạn
                    accountName: "Vo Anh Minh",    // Thay thế bằng tên tài khoản của bạn
                    acqId: 970415,                   // Mã ngân hàng của bạn
                    amount: amount,
                    addInfo: `Thanh toan don hang ${orderId}`,
                    template: "compact"
                })
            });

            const result = await response.json();
            
            if (result.code === "00") {
                setQrImage(result.data.qrDataURL);
            } else {
                console.error('Error generating QR:', result);
                Alert.alert('Lỗi', 'Không thể tạo mã QR thanh toán');
            }
        } catch (error) {
            console.error('Error:', error);
            Alert.alert('Lỗi', 'Không thể kết nối đến server');
        }
    };

    const handlePaymentSuccess = async () => {
        try {
            await firestore()
                .collection('Appointments')
                .doc(orderId)
                .update({
                    paymentStatus: 'paid',
                    paidAt: firestore.FieldValue.serverTimestamp(),
                });

            Alert.alert(
                'Thành công',
                'Thanh toán đã được xác nhận',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            console.error('Error updating payment status:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thanh toán');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quét mã để thanh toán</Text>
            
            <View style={styles.qrContainer}>
                {qrImage ? (
                    <Image
                        source={{ uri: qrImage }}
                        style={styles.qrImage}
                        resizeMode="contain"
                    />
                ) : (
                    <Text>Đang tạo mã QR...</Text>
                )}
            </View>

            <Text style={styles.amount}>
                Số tiền: {Number(amount).toLocaleString('vi-VN')} VNĐ
            </Text>

            <Button
                mode="contained"
                onPress={() => navigation.navigate('Appointment')}
                style={styles.button}
                labelStyle={styles.buttonText}
            >
                Quay về trang chủ
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 20,
    },
    qrContainer: {
        width: '90%',
        aspectRatio: 1,
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    qrImage: {
        width: '100%',
        height: '100%',
    },
    amount: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    button: {
        width: '100%',
        padding: 8,
        backgroundColor: '#4CAF50',
        marginTop: 10,
        height: 56,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'none',
        color: 'white',
    },
});

export default PaymentQR;
