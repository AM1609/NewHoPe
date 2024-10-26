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
        const unsubscribe = firestore()
            .collection('Appointments')
            .where('email', '==', userLogin.email)
            .onSnapshot(querySnapshot => {
                const appointmentsData = [];
                querySnapshot.forEach(documentSnapshot => {
                    appointmentsData.push({
                        ...documentSnapshot.data(),
                        id: documentSnapshot.id,
                    });
                });

                // Sắp xếp theo thời gian, đơn hàng mới nhất ở trên cùng
                appointmentsData.sort((a, b) => b.datetime.toDate() - a.datetime.toDate());

                setAppointments(appointmentsData);
            });
            
        return () => unsubscribe();
    }, []);
    
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
                        item.state === 'new' ? styles.redText : 
                        item.state === 'completed' ? styles.greenText : 
                        styles.defaultText
                    ]}>
                        Trạng thái: {item.state === 'new' ? 'Đang giao' : 'Đã hoàn thành'}
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
    greenText: { // Màu xanh lá cho trạng thái "Đã hoàn thành"
        color: 'green',
        fontSize: 26, // Kích thước lớn hơn
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
