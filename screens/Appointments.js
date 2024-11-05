import React, { useState, useEffect } from "react";
import { View, FlatList,StyleSheet } from "react-native";
import { Text,Card,Title,Paragraph,IconButton, Button } from "react-native-paper";
import firestore from '@react-native-firebase/firestore';
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { useMyContextProvider } from "../index";
import { useNavigation } from '@react-navigation/native'; // Thêm import này
import colors from '../screens/colors'; // Thêm import này

const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]); // State để lưu dịch vụ
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;
    const navigation = useNavigation(); // Khởi tạo navigation

    useEffect(() => {
        console.log("userLogin.base", userLogin.base);
        const appointmentsRef = firestore().collection('Appointments');
        
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

    // show các lịch
    const renderItem = ({ item }) => {
        const service = services.find(s => s.id === item.serviceId); // Tìm dịch vụ tương ứng với item
        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Paragraph style={[styles.text, 
                        item.state === 'delivering' ? styles.redText : 
                        item.state === 'delivered' ? styles.greenText :
                        item.state === 'canceled' ? styles.canceledText :
                        styles.defaultText
                    ]}>
                        Trạng thái: {
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
});
