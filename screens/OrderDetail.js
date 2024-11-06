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

                if (!currentUser) {
                    console.log('No authenticated user found');
                    Alert.alert('Error', 'Vui lòng đăng nhập để tiếp tục');
                    navigation.navigate('Login');
                    return;
                }

                // First try to get user data from Firestore
                const userDoc = await firestore()
                    .collection('users')
                    .doc(currentUser.uid)
                    .get();

                if (userDoc.exists) {
                    const userData = {
                        ...userDoc.data(),
                        email: currentUser.email,
                        uid: currentUser.uid
                    };
                    console.log('User data from Firestore:', userData);
                    console.log('User role:', userData.role);
                    setUser(userData);
                    // Check if user is staff
                    setIsStaff(userLogin.role === 'staff');
                    console.log('Is staff?:', userLogin.role === 'staff');
                } else {
                    // If no Firestore document exists, create one with basic auth data
                    const basicUserData = {
                        email: currentUser.email,
                        uid: currentUser.uid,
                        displayName: currentUser.displayName || '',
                        phoneNumber: currentUser.phoneNumber || '',
                        createdAt: firestore.FieldValue.serverTimestamp()
                    };

                    // Create the user document
                    await firestore()
                        .collection('users')
                        .doc(currentUser.uid)
                        .set(basicUserData);

                    console.log('Created new user document:', basicUserData);
                    setUser(basicUserData);
                    setIsStaff(false); // New users are not staff by default
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
    }, [navigation]);

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
                            
                            Alert.alert('Thành công', 'Đơn hàng đã được huỷ');
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
    const handleDeliveryMap = () => {
        navigation.navigate('DeliveryMap', {
            order: orderData,
            orderId: order.id || orderData?.id
        });
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
                        <Text style={styles.status}>
                            Trạng thái: {
                                orderData.state === 'delivering' ? 'Đang giao' :
                                orderData.state === 'delivered' ? 'Đã giao' :
                                orderData.state === 'canceled' ? 'Đã huỷ' :
                                orderData.state === 'pending' ? 'Chưa thanh toán' :
                                'Chưa thanh toán'
                            }
                        </Text>
                        <Text style={styles.datetime}>Thời gian: {orderData.datetime ? orderData.datetime.toDate().toLocaleString() : 'Không xác định'}</Text>
                        <Text style={styles.totalPrice}>Tổng tiền: {orderData.totalPrice?.toLocaleString('vi-VN')} vnđ</Text>
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
                    </View>
                ) : (
                    <Text>Đang tải dữ liệu...</Text>
                )}
            </ScrollView>
            <View style={styles.buttonContainer}>
                {orderData && (!orderData.state || ['new', 'pending'].includes(orderData.state)) && !isStaff && (
                    <>
                        <Button 
                            mode="contained" 
                            onPress={handlePayment}
                            style={styles.paymentButton}
                            labelStyle={styles.buttonText}
                        >
                            Thanh toán ngay
                        </Button>
                        
                        <Button 
                            mode="contained" 
                            onPress={handleCancelOrder}
                            style={styles.cancelButton}
                            labelStyle={styles.buttonText}
                            color="#FF3B30"
                        >
                            Huỷ đơn hàng
                        </Button>
                    </>
                )}
                
                {isStaff && orderData?.state === 'delivering' && (
                    <Button 
                        mode="contained" 
                        onPress={handleDeliveryMap}
                        style={styles.deliveredButton}
                        labelStyle={styles.buttonText}
                    >
                        Bản đồ giao hàng
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
        padding: 20,
        backgroundColor: 'white',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    orderDetails: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 20,
        marginVertical: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    status: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    datetime: {
        fontSize: 16,
        color: '#555',
        marginBottom: 10,
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    serviceContainer: {
        marginBottom: 15,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: '500',
    },
    optionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 5,
    },
    option: {
        fontSize: 14,
        color: '#333',
    },
    buttonContainer: {
        marginTop: 'auto', // Pushes the buttons to the bottom
        paddingVertical: 20,
    },
    buttonText: {
        fontSize: 18, // Increase font size
        fontWeight: 'bold', // Optional: make text bold
    },
    paymentButton: {
        marginBottom: 10,
        backgroundColor: '#2196F3',
        paddingVertical: 10,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    cancelButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 10,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    scrollView: {
        flexGrow: 1,
    },
    deliveredButton: {
        backgroundColor: '#4CAF50', // Màu xanh lá
        paddingVertical: 10,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
});
