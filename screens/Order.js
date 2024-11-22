import React, { useState, useEffect } from "react";
import { View, FlatList,StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Text,Card,Title,Paragraph,IconButton, Button } from "react-native-paper";
import firestore from '@react-native-firebase/firestore';
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { useMyContextProvider } from "../index";
import { useNavigation } from '@react-navigation/native'; // Thêm import này
import colors from '../routers/colors'; // Thêm import này
import auth from '@react-native-firebase/auth';
import notifee from '@notifee/react-native';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]); // State để lưu dịch vụ
    const [controller, setController] = useMyContextProvider();
    const { userLogin } = controller;
    const navigation = useNavigation(); // Khởi tạo navigation
    const [isLoading, setIsLoading] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [user, setUser] = useState(null);

    async function onDisplayNotification(order) {
        // Create a notification channel (required for Android)
        const channelId = await notifee.createChannel({
            id: 'new-orders',
            name: 'New Orders',
            importance: 4,
            vibration: true,
        });

        // Display notification
        await notifee.displayNotification({
            title: 'Đơn hàng mới!',
            body: `Có đơn hàng mới với giá trị ${order.totalPrice.toLocaleString('vi-VN')} VNĐ`,
            android: {
                channelId,
                pressAction: {
                    id: 'default',
                },
                importance: 4,
                sound: 'default',
            },
        });
    }

    useEffect(() => {
        if (!userLogin?.email) {
            console.log('Missing email:', userLogin?.email);
            navigation.navigate('Login');
            return;
        }

        const appointmentsRef = firestore().collection('Appointments');
        console.log('User role:', userLogin.role);
        console.log('User base:', userLogin.base);
        
        let query;
        if (userLogin.role === 'staff') {
            query = appointmentsRef
                .where('store.name', '==', userLogin.base)
                .where('state', 'in', ['unpaid', 'preparing', 'delivering', 'delivered']);
        } else {
            query = appointmentsRef.where('email', '==', userLogin.email);
        }

        const unsubscribe = query.onSnapshot(querySnapshot => {
            const appointmentsData = [];
            querySnapshot.forEach(documentSnapshot => {
                const data = documentSnapshot.data();
                appointmentsData.push({
                    ...data,
                    id: documentSnapshot.id,
                });
            });

            appointmentsData.sort((a, b) => b.datetime.toDate() - a.datetime.toDate());
            console.log('Total appointments found:', appointmentsData.length);
            setAppointments(appointmentsData);
        }, error => {
            console.error('Snapshot error:', error);
        });
            
        return () => unsubscribe();
    }, [userLogin]);
    
    useEffect(() => {
        const fetchServices = async () => {
            try {
                // Kiểm tra userLogin trước khi thực hiện các thao tác
                if (!controller.userLogin) {
                    navigation.navigate('Login');
                    return;
                }
                
                const servicesCollection = await firestore().collection('services').get();
                const servicesData = servicesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setServices(servicesData);
            } catch (error) {
                console.error("Lỗi khi lấy dịch vụ: ", error);
            }
        };

        fetchServices();
    }, [controller.userLogin, navigation]);

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const currentUser = auth().currentUser;
                
                if (!currentUser || !currentUser.email) {
                    console.log('No authenticated user or email found');
                    navigation.navigate('Login');
                    return;
                }

                console.log('Current user email:', currentUser.email);

                const userDoc = await firestore()
                    .collection('USERS')
                    .doc(currentUser.email)
                    .get();

                if (userDoc.exists) {
                    const userData = userDoc.data();
                    console.log('Fetched user data:', userData);
                    
                    // Ensure all required fields are present
                    if (!userData.email) {
                        userData.email = currentUser.email;
                    }

                    setUser(userData);
                    // Cập nhật lại context với dữ liệu chính xác từ Firestore
                    setController({
                        type: 'USER_LOGIN',
                        value: {
                            email: userData.email,
                            base: userData.base, // Lấy base trực tiếp từ userData
                            role: userData.role || 'customer',
                            fullName: userData.fullName,
                            phone: userData.phone,
                            address: userData.address
                        }
                    });
                    setIsStaff(userData.role === 'staff');
                    
                    // Log để kiểm tra
                    console.log('Updated user base:', userData.base);
                } else {
                    console.log('User document not found for email:', currentUser.email);
                    navigation.navigate('Login');
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

        // Chạy fetchUserData khi component mount hoặc khi không có userLogin
        if (!controller.userLogin?.email) {
            fetchUserData();
        }
    }, [controller.userLogin, setController]);

    const formatDateTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        
        // Định dạng ngày thành DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        // Định dạng giờ thành HH:mm
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}/${month}/${year}, ${hours}:${minutes}`;
    };

    // show các lch
    const renderItem = ({ item }) => {
        const service = services.find(s => s.id === item.serviceId);
        
        const getStatusStyle = (state) => {
            switch(state) {
                case 'preparing':
                    return { backgroundColor: '#FFF3E0', statusColor: '#F57C00' }; // Orange
                case 'delivering':
                    return { backgroundColor: '#E3F2FD', statusColor: '#1976D2' }; // Blue
                case 'delivered':
                    return { backgroundColor: '#E8F5E9', statusColor: '#2E7D32' }; // Green
                case 'canceled':
                    return { backgroundColor: '#FFEBEE', statusColor: '#D32F2F' }; // Red
                default:
                    return { backgroundColor: '#F3E5F5', statusColor: '#9C27B0' }; // Purple for unpaid/default state
            }
        };

        const statusStyle = getStatusStyle(item.state);

        return (
            <Card style={[styles.card, { backgroundColor: statusStyle.backgroundColor }]}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.statusText, { color: statusStyle.statusColor }]}>
                            {item.state === 'preparing' ? 'Đang chuẩn bị' :
                             item.state === 'delivering' ? 'Đang giao' :
                             item.state === 'delivered' ? 'Đã giao' :
                             item.state === 'canceled' ? 'Đã huỷ' :
                             'Chưa thanh toán'}
                        </Text>
                        <Text style={styles.dateText}>
                            {formatDateTime(item.datetime)}
                        </Text>
                    </View>

                    <View style={styles.cardBody}>
                        <Text style={styles.priceText}>
                            <Text style={styles.priceValue}>{item.totalPrice.toLocaleString('vi-VN')}</Text>
                            <Text style={styles.priceCurrency}> vnđ</Text>
                        </Text>
                        {service && (
                            <Text style={styles.serviceText}>
                                {service.name}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity 
                        style={styles.detailButton}
                        onPress={() => navigation.navigate('OrderDetail', { order: item })}
                    >
                        <Text style={styles.detailButtonText}>Xem chi tiết</Text>
                    </TouchableOpacity>
                </Card.Content>
            </Card>
        );
    };
    
    const handleOrderDetail = (orderId) => {
        navigation.navigate("OrderDetail", { orderId });
    };

    return (
        <View style={{ flex: 1 , backgroundColor:"white"}}>
            <View style={{ backgroundColor:colors.background }}>
                <Text style={{ padding: 15, fontSize: 25, fontWeight: "bold", backgroundColor: colors.background, textAlign: "center", color: "#fff" }}>
                    Đơn hàng
                </Text>
            </View>
            <FlatList
                data={appointments}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    )
}

export default Appointments;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        backgroundColor: colors.primary,
        color: colors.white,
        // ...
    },
    card: {
        marginHorizontal: 15,
        marginVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    statusText: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    cardBody: {
        marginVertical: 4,
    },
    priceText: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
    },
    priceCurrency: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    serviceText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    detailButton: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    detailButtonText: {
        color: '#1976D2',
        fontWeight: '600',
        fontSize: 15,
    },
    headerContainer: {
        backgroundColor: colors.background,
        padding: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
    },
    listContainer: {
        paddingVertical: 10,
    },
});
