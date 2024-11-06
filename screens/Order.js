import React, { useState, useEffect } from "react";
import { View, FlatList,StyleSheet, Alert } from "react-native";
import { Text,Card,Title,Paragraph,IconButton, Button } from "react-native-paper";
import firestore from '@react-native-firebase/firestore';
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { useMyContextProvider } from "../index";
import { useNavigation } from '@react-navigation/native'; // Thêm import này
import colors from './colors'; // Thêm import này
import auth from '@react-native-firebase/auth';

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]); // State để lưu dịch vụ
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;
    const navigation = useNavigation(); // Khởi tạo navigation
    const [isLoading, setIsLoading] = useState(false);
    const [isStaff, setIsStaff] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        console.log("userLogin.base", userLogin.base);
        const appointmentsRef = firestore().collection('Appointments');
        console.log('Is sdwadtaff?:', userLogin.role === 'staff');
        // Query dựa trên role và base của user
        const query = userLogin.role === 'staff' 
            ? appointmentsRef.where('store.name', '==', userLogin.base)  // Truy cập store.name trong map
            : appointmentsRef.where('email', '==', userLogin.email);  // Nếu là customer, chỉ lấy đơn của họ

        const unsubscribe = query.onSnapshot(querySnapshot => {
            const appointmentsData = [];
            querySnapshot.forEach(documentSnapshot => {
                const data = documentSnapshot.data();
                console.log("Store name:", data.store?.name); // Log store name của mỗi đơn hàng
                console.log("Current user base:", userLogin.base); // Log base của user đang đăng nhập
                appointmentsData.push({
                    ...data,
                    id: documentSnapshot.id,
                });
            });

            // Sắp xếp theo thời gian, đơn hàng mới nhất ở trên cùng
            appointmentsData.sort((a, b) => b.datetime.toDate() - a.datetime.toDate());

            setAppointments(appointmentsData);
        });
            
        return () => unsubscribe();
    }, [userLogin.role, userLogin.base]);
    
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const servicesCollection = await firestore().collection('services').get();
                const servicesData = servicesCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setServices(servicesData);
            } catch (error) {
                console.error("Lỗi khi lấy dịch vụ: ", error);
            }
        };

        fetchServices();
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const currentUser = auth().currentUser;
                
                if (!currentUser) {
                    setIsStaff(false); // Set default value when no user
                    console.log('No authenticated user found');
                    Alert.alert('Error', 'Vui lòng đăng nhập để tiếp tục');
                    navigation.navigate('Login');
                    return;
                }

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
                    setUser(userData);
                    // Add null check before accessing role
                    setIsStaff(userData?.role === 'staff' || false);
                } else {
                    // Set default values for new users
                    setIsStaff(false);
                    // ... rest of your new user creation code ...
                }
            } catch (error) {
                console.error("Error in fetchUserData:", error);
                setIsStaff(false);
                Alert.alert(
                    'Error',
                    'Không thể tải thông tin người dùng. Vui lòng thử lại sau.'
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // show các lịch
    const renderItem = ({ item }) => {
        const service = services.find(s => s.id === item.serviceId); // Tìm dịch vụ tương ứng với item
        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Paragraph style={[styles.text, 
                        item.state === 'delivering' ? styles.deliveringText : 
                        item.state === 'delivered' ? styles.greenText :
                        item.state === 'canceled' ? styles.canceledText :
                        styles.defaultText
                    ]}>
                        {
                            item.state === 'delivering' ? 'Đang giao' :
                            item.state === 'delivered' ? 'Đã giao' :
                            item.state === 'canceled' ? 'Đã huỷ' :
                            'Chưa thanh toán'
                        }
                    </Paragraph>
                    <Paragraph style={styles.text}>Thời gian: {item.datetime ? item.datetime.toDate().toLocaleString() : 'Không xác định'}</Paragraph>
                    <Paragraph style={styles.text}>
                        Tổng tiền: {item.totalPrice.toLocaleString('vi-VN')} vnđ
                    </Paragraph>
                    {service && <Paragraph style={styles.text}>Dịch vụ: {service.name}</Paragraph>} 
                    <Button onPress={() => navigation.navigate('OrderDetail', { order: item })}>Xem chi tiết</Button>
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
            />
        </View>
    )
}

export default Appointments;
const styles = StyleSheet.create({
    text: {
        fontSize: 17, 
        fontWeight: "bold",
        paddingVertical: 5, // Thêm padding dọc để tránh bị mất phần trên
    },
    redText: { // Màu đỏ cho trạng thái "Đang giao"
        color: 'red',
        fontSize: 26, // Kích thước lớn hơn
        fontWeight: "bold",
    },
    greenText: { // Màu xanh lá cho trạng thái "Đã giao"
        color: 'green',
        fontSize: 26,
        fontWeight: "bold",
    },
    canceledText: { // Màu xám cho trạng thái "Đã huỷ"
        color: 'gray',
        fontSize: 26,
        fontWeight: "bold",
    },
    defaultText: { // Màu mặc định cho các trạng thái khác
        color: 'black',
        fontSize: 26, // Kích thước lớn hơn
        fontWeight: "bold",
    },
    largeText: { // Thêm kiểu dáng cho trạng thái "Đang giao"
        fontSize: 22, // Kích thước lớn hơn
        fontWeight: "bold",
    },
    card: {
        margin: 10,
        borderRadius: 8,
        elevation: 3,
        backgroundColor: '#E0EEE0',
    },
    deliveringText: {
        fontSize: 26,
        color: 'blue', // Blue for "Đang giao"
    },
    canceledText: {
        fontSize: 26,
        color: 'red', // Red for "Đã huỷ"
    },
    defaultText: {
        fontSize: 26,
        color: 'black', // Default color
    },
    status: {
        fontSize: 20, // Increase font size
        fontWeight: 'bold',
        marginBottom: 10,
        fontFamily: 'System', // Use a system font that supports Vietnamese
    },
});
