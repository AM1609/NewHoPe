import React, { useState, useEffect } from "react";
import { View, FlatList,TouchableOpacity,StyleSheet,Alert, Image } from "react-native";
import { Text,Card,Title,Paragraph, Button,IconButton } from "react-native-paper";
import { Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import firestore from '@react-native-firebase/firestore';

const Appointadmin = () => {
    const [appointments, setAppointments] = useState([]);
    
    const [isSelected, setSelection] = useState([]);
    
    

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Appointments')
            .onSnapshot(querySnapshot => {
                const appointmentsData = [];
                querySnapshot.forEach(documentSnapshot => {
                    appointmentsData.push({
                        ...documentSnapshot.data(),
                        id: documentSnapshot.id,
                    });
                });
                setAppointments(appointmentsData);
            });

        return () => unsubscribe();
    }, []);

    const handleUpdateService = async (item) => {
        try {
            await firestore()
                .collection('Appointments')
                .doc(item)
                .update({
                    state: "complete"
                });
        } catch (error) {
            console.error("Lỗi khi cập nhật dịch vụ:", error);
        }
        
    }
    
    
// show các lịch
const renderItem = ({ item }) => (
    <Card style={styles.card}>
        <Card.Content >
            <Title style={styles.text}>Mã xác nhận: {item.id}</Title>
            <Paragraph style={styles.text}>Người đặt: {item.email}</Paragraph>
            <Paragraph style={styles.text}>Thời gian đặt: {item.datetime ? item.datetime.toDate().toLocaleString('en-GB', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }) : 'V/N'}</Paragraph>
            <Paragraph style={styles.text}>Sản phẩm: {item.service}</Paragraph>
            <Paragraph style={styles.text}>Giá: {item.price}</Paragraph>
            <Paragraph style={styles.text}>Liên hệ: {item.phone}</Paragraph>
            <Paragraph style={styles.text}>Trạng thái: {item.state}</Paragraph>
        </Card.Content>
        <Card.Actions>
            <Menu>
                <MenuTrigger>
                    <Image source={require("../assets/dots.png")}
                    style={{
                        justifyContent:"flex-end",
                        width:25,
                        height:25
                        
                    }}></Image>
                </MenuTrigger>
                <MenuOptions>
                    <MenuOption onSelect={() => handleUpdateService(item.id)}>
                        <Text style={styles.menuOption}>Xác nhận</Text>
                    </MenuOption>
                    <MenuOption onSelect={() => handleDelete(item)}>
                        <Text style={styles.menuOption}>Xoá</Text>
                    </MenuOption>
                </MenuOptions>
            </Menu>
        </Card.Actions>
    </Card>
);

const handleDelete = (item) => {
    Alert.alert(
        "Cảnh báo",
        "Bạn có chắc muốn xoá hoá đơn này, nó sẽ không thể khôi phục lại!!!",
        [
            {
                text: "Trở lại",
                style: "cancel"
            },
            {
                text: "Xoá",
                onPress: () => {
                    firestore()
                        .collection('Appointments')
                        .doc(item.id)
                        .delete()
                        .then(() => {
                            console.log("Deleted successfully!");
                        })
                        .catch(error => {
                            console.error("Error:", error);
                        });
                },
                style: "destructive"
            }
        ]
    );
};
    
    
    return (
        <View style={{flex:1, backgroundColor:"white"}}>
            <Text style={{ padding: 15, fontSize: 25, fontWeight: "bold", backgroundColor:"orange" }}>Đơn hàng</Text>
            <FlatList
                data={appointments}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                
            />
        </View>
    )
}

const styles = StyleSheet.create({
    text: {
        fontSize: 17, fontWeight: "bold"
    },
    card: {
        margin: 10,
        borderRadius: 15,
        elevation: 3,
        backgroundColor: '#E0EEE0',
    },
    menuOption: {
        fontSize: 16,
        padding: 10,
    },
});
export default Appointadmin;
