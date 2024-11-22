import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import firestore from '@react-native-firebase/firestore'; // Import Firebase
import auth from '@react-native-firebase/auth'; // Import Firebase Auth
import { useMyContextProvider } from "../index";

const OrderDetail = ({ route, navigation }) => {
    const { order } = route.params; // Thêm userLogin vào params
    const [orderData, setOrderData] = useState(null); // State để lưu dữ liệu đơn hàng
    const [user, setUser] = useState(null); // State để lưu dữ liệu người dùng
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;
    const [isLoading, setIsLoading] = useState(true); // Add loading state
    const [isStaff, setIsStaff] = useState(userLogin?.role === 'staff'); // Sử dụng userLogin.role

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const orderDoc = await firestore()
                    .collection('Appointments')
                    .doc(order.id) // Make sure this is the document ID
                    .get();

                if (orderDoc.exists) {
                    // Include the document ID in the order data
                    setOrderData({
                        ...orderDoc.data(),
                        id: orderDoc.id // Ensure we store the actual Firestore document ID
                    });
                    console.log('Fetched order data:', {
                        ...orderDoc.data(),
                        id: orderDoc.id
                    });
                } else {
                    console.log("Không tìm thấy đơn hàng");
                    Alert.alert('Error', 'Không tìm thấy thông tin đơn hàng');
                }
            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu đơn hàng: ", error);
                Alert.alert('Error', 'Không thể tải thông tin đơn hàng');
            }
        };

        fetchOrderData();
    }, [order.id]);

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const currentUser = auth().currentUser;
                console.log('Current auth user:', currentUser); // Debug log

                if (!userLogin?.email) {
                    console.log('No user login data found');
                    return;
                }

                // First try to get user data from Firestore
                const userDoc = await firestore()
                    .collection('users')
                    .doc(currentUser?.uid || userLogin.uid)
                    .get();

                if (userDoc.exists) {
                    const userData = {
                        ...userDoc.data(),
                        email: userLogin.email,
                        uid: currentUser?.uid || userLogin.uid
                    };
                    console.log('User data from Firestore:', userData);
                    console.log('User role:', userData.role);
                    setUser(userData);
                    setIsStaff(userLogin.role === 'staff');
                    console.log('Is staff?:', userLogin.role === 'staff');
                }
            } catch (error) {
                console.error("Error in fetchUserData:", error);
                Alert.alert(
                    'Error',
                    'Không thể tải thông tin người dùng. Vui lòng thử lại sau.'
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [navigation, userLogin]);

    const handlePayment = () => {
        console.log('Order Data:', orderData); // Debug log

        if (isLoading) {
            Alert.alert('Error', 'Vui lòng đợi trong khi chúng tôi tải thông tin người dùng');
            return;
        }

        if (!user || !user.email) {
            Alert.alert('Error', 'Vui lòng đăng nhập lại để tiếp tục');
            return;
        }

        // Get the correct document ID
        const appointmentId = order.id || orderData?.id;
        console.log('Appointment ID:', appointmentId); // Debug log

        if (!appointmentId) {
            Alert.alert('Error', 'Không tìm thấy mã đơn hàng');
            return;
        }

        if (!orderData?.totalPrice) {
            Alert.alert('Error', 'Không tìm thấy thông tin thanh toán');
            return;
        }

        const paymentData = {
            appointmentId: appointmentId, // Using the correct Firestore document ID
            totalAmount: parseInt(orderData.totalPrice),
            userInfo: {
                email: user.email,
                uid: user.uid,
                displayName: user.displayName || '',
                phoneNumber: user.phoneNumber || ''
            },
            cartItems: [{
                id: appointmentId,
                title: orderData?.services?.[0]?.title || 'Service',
                price: parseInt(orderData.totalPrice),
                quantity: 1
            }]
        };
        
        console.log('Payment Data being passed:', paymentData); // Debug log
        navigation.navigate('PaymentZalo', paymentData);
    };

    const handleCancelOrder = async () => {
        try {
            // Hiển thị hộp thoại xác nhận
            Alert.alert(
                'Xác nhận huỷ đơn',
                'Bạn có chắc chắn muốn huỷ đơn hàng này không?',
                [
                    {
                        text: 'Không',
                        style: 'cancel',
                    },
                    {
                        text: 'Có',
                        onPress: async () => {
                            const appointmentId = order.id || orderData?.id;
                            await firestore()
                                .collection('Appointments')
                                .doc(appointmentId)
                                .update({
                                    state: 'canceled',
                                    canceledAt: firestore.FieldValue.serverTimestamp(),
                                });
                            
                            // Cập nhật state local
                            setOrderData(prev => ({
                                ...prev,
                                state: 'canceled'
                            }));
                            
                            Alert.alert('Thành công', 'Đơn hàng  đã được huỷ');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Lỗi khi huỷ đơn hàng:', error);
            Alert.alert('Lỗi', 'Không thể huỷ đơn hàng. Vui lòng thử lại sau.');
        }
    };

    // Thêm hàm xử lý chuyển đến màn hình Map
    const handleDeliveryMap = async () => {
        try {
            const appointmentId = order.id || orderData?.id;
            
            // Update order status to 'delivering'
            await firestore()
                .collection('Appointments')
                .doc(appointmentId)
                .update({
                    state: 'delivering',
                    deliveryStartTime: firestore.FieldValue.serverTimestamp()
                });
            
            // Update local state
            setOrderData(prev => ({
                ...prev,
                state: 'delivering'
            }));

            // Navigate to delivery map
            navigation.navigate('DeliveryMap', {
                order: {
                    ...orderData,
                    state: 'delivering'
                },
                orderId: appointmentId
            });
            
        } catch (error) {
            console.error('Error starting delivery:', error);
            Alert.alert('Lỗi', 'Không thể bắt đầu giao hàng. Vui lòng thử lại sau.');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Đang tải thông tin...</Text>
            </View>
        );
    }

    console.log('Debug values:', {
        orderState: orderData?.state,
        isStaff: isStaff,
        shouldShowButtons: (!orderData?.state || orderData?.state === 'new' || orderData?.state === 'pending') && !isStaff
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Chi tiết đơn hàng</Text>
            <ScrollView style={styles.scrollView}>
                {orderData ? (
                    <View style={styles.orderDetails}>
                        <Text style={[
                            styles.status,
                            {
                                backgroundColor: 
                                    orderData.state === 'preparing' ? '#FFF3E0' :
                                    orderData.state === 'delivering' ? '#E3F2FD' :
                                    orderData.state === 'delivered' ? '#E8F5E9' :
                                    orderData.state === 'canceled' ? '#FFEBEE' :
                                    '#F3E5F5',
                                color: 
                                    orderData.state === 'preparing' ? '#F57C00' :
                                    orderData.state === 'delivering' ? '#1976D2' :
                                    orderData.state === 'delivered' ? '#2E7D32' :
                                    orderData.state === 'canceled' ? '#D32F2F' :
                                    '#9C27B0'
                            }
                        ]}>
                            Trạng thái: {
                                orderData.state === 'preparing' ? 'Đang chuẩn bị' :
                                orderData.state === 'delivering' ? 'Đang giao' :
                                orderData.state === 'delivered' ? 'Đã giao' :
                                orderData.state === 'canceled' ? 'Đã huỷ' :
                                'Chưa thanh toán'
                            }
                        </Text>
                        <Text style={styles.datetime}>Thời gian: {orderData.datetime ? orderData.datetime.toDate().toLocaleString() : 'Không xác định'}</Text>
                        <Text style={styles.totalPrice}>
                            Tổng tiền: {orderData.totalPrice?.toLocaleString('vi-VN')} đ
                        </Text>
                        <Text style={styles.summaryTitle}>Tóm tắt đơn hàng:</Text>
                        {Array.isArray(orderData.services) ? (
                            orderData.services.map((service, index) => (
                                <View key={index} style={styles.serviceContainer}>
                                    <Text style={styles.serviceTitle}>{service.title} x {service.quantity}</Text>
                                    {Array.isArray(service.options) && service.options.length > 0 ? (
                                        <>
                                            <Text style={styles.optionTitle}>Tùy chọn:</Text>
                                            {service.options.map((option, optionIndex) => (
                                                <Text key={optionIndex} style={styles.option}>{option.name} </Text>
                                            ))}
                                        </>
                                    ) : null}
                                </View>
                            ))
                        ) : (
                            <Text>Không xác định</Text>
                        )}
                        {orderData.state === 'delivering' && (
                            <Button
                                mode="contained"
                                onPress={() => navigation.navigate('DeliveryMap', {
                                    order: orderData,
                                    orderId: order.id || orderData?.id
                                })}
                                style={styles.trackButton}
                            >
                                Theo dõi tiến trình đơn hàng
                            </Button>
                        )}
                    </View>
                ) : (
                    <Text>Đang tải dữ liệu...</Text>
                )}
            </ScrollView>
            <View style={styles.buttonContainer}>
                {orderData && (!orderData.state || ['new', 'pending'].includes(orderData.state)) && !isStaff && (
                    <View style={styles.buttonRow}>
                        <Button 
                            mode="contained" 
                            onPress={handlePayment}
                            style={[styles.button, styles.paymentButton]}
                            labelStyle={styles.buttonText}
                        >
                            Thanh toán ngay
                        </Button>
                        
                        <Button 
                            mode="contained" 
                            onPress={handleCancelOrder}
                            style={[styles.button, styles.cancelButton]}
                            labelStyle={styles.buttonText}
                            color="#FF3B30"
                        >
                            Huỷ đơn hàng
                        </Button>
                    </View>
                )}
                
                {isStaff && orderData?.state === 'preparing' && (
                    <Button 
                        mode="contained" 
                        onPress={handleDeliveryMap}
                        style={styles.deliveredButton}
                        labelStyle={styles.deliveryButtonText}
                    >
                        Bắt đầu giao hàng
                    </Button>
                )}
            </View>
        </View>
    );
};

export default OrderDetail;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F5F7FA',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 24,
        color: '#1A237E',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    orderDetails: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        marginVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    status: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        color: '#1976D2',
        textTransform: 'uppercase',
        letterSpacing: 1,
        textAlign: 'center',
        backgroundColor: '#E3F2FD',
        padding: 8,
        borderRadius: 8,
    },
    datetime: {
        fontSize: 16,
        color: '#546E7A',
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    totalPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1976D2',
        textAlign: 'left',
        marginVertical: 16,
        letterSpacing: 0.5,
    },
    summaryTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        color: '#37474F',
        letterSpacing: 0.5,
    },
    serviceContainer: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 4,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#37474F',
        marginBottom: 8,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#546E7A',
        marginTop: 8,
        marginBottom: 4,
    },
    option: {
        fontSize: 14,
        color: '#78909C',
        marginLeft: 8,
        marginBottom: 4,
    },
    buttonContainer: {
        marginTop: 'auto',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,  // Để các nút có chiều rộng bằng nhau
        paddingVertical: 8,
        borderRadius: 12,
    },
    paymentButton: {
        backgroundColor: '#2196F3',
    },
    cancelButton: {
        backgroundColor: '#FF4444',
    },
    deliveredButton: {
        backgroundColor: '#66BB6A',
        paddingVertical: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#66BB6A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        marginTop: 20,
    },
    deliveryButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    scrollView: {
        flexGrow: 1,
    },
    trackButton: {
        marginVertical: 10,
        backgroundColor: '#1976D2',
        paddingVertical: 8,
    },
});
