import React, { useState, useEffect } from "react"
import { View, Image, Alert, FlatList, StyleSheet, ScrollView } from "react-native"
import { TouchableOpacity } from "react-native-gesture-handler"
import { Button, Text } from "react-native-paper"
import datetime from "react-native-date-picker"
import DatePicker from "react-native-date-picker"
import firestore from "@react-native-firebase/firestore"
import { useMyContextProvider } from "../index"
import Appointments from "./Appointments"
import { useCart } from "../routers/CartContext"
import CheckBox from '@react-native-community/checkbox'; 
const Appointment = ({navigation, route }) => {
    const { service,} = route.params || {};
    const [datetime, setDatetime] = useState(new Date())
    const [dateadd,setDateadd]=useState("")
    const [open, setOpen] = useState(false)
    const [controller, dispatch] = useMyContextProvider()
    const {userLogin} = controller
    const APPOINTMENTs = firestore().collection("Appointments")
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1); // Thêm state đ theo dõi số lượng
    const [options, setOptions] = useState([]); // State để lưu trữ tùy chọn
    const [selectedOptions, setSelectedOptions] = useState([]); // State để theo dõi các tùy chọn đã chọn
    const [optionPrice, setOptionPrice] = useState(0); // Thêm state để lưu tổng giá của các tùy chọn

    useEffect(() => {
        const unsubscribe = firestore()
            .collection("Services") // Truy cập collection cha
            .doc(service.id) // Thay "serviceId" bằng ID của tài liệu bạn muốn truy cập
            .collection("Option") // Truy cập collection con
            .onSnapshot(snapshot => {
                const optionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOptions(optionsData);
                console.log(optionsData)
            });

        return () => unsubscribe(); // Dọn dẹp khi component unmount
    }, []);

   
      
    const handleAddToCart = (service) => {
        addToCart(service, quantity, selectedOptions); // Truyền selectedOptions vào addToCart
        Alert.alert("Thông báo", `Sản phẩm đã được thêm vào giỏ hàng! Tổng giá tùy chọn: ${optionPrice.toLocaleString('vi-VN')} ₫`, [
            { text: "OK", onPress: () => navigation.goBack() } // Quay lại trang trước
           
        ]);
        console.log("DDM",selectedOptions)
    };

    const toggleOption = (id) => {
        setSelectedOptions(prev => {
            const newSelectedOptions = prev.some(option => option.id === id)
                ? prev.filter(option => option.id !== id)
                : [...prev, { id, name: options.find(option => option.id === id).OptionName, price: options.find(option => option.id === id).Price }];
            
            // Cập nhật giá của các tùy chọn đã chọn
            const totalOptionPrice = newSelectedOptions.reduce((sum, option) => sum + (Number(option.price) || 0), 0);
            
            setOptionPrice(totalOptionPrice); // Cập nhật tổng giá
            return newSelectedOptions;
        });
    };

    const totalPrice = Number(service.price) + optionPrice; 

    return (
        <View style={styles.container}> 
            <FlatList
                data={options}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.optionContainer}>
                        <CheckBox
                            value={selectedOptions.some(option => option.id === item.id)} 
                            onValueChange={() => toggleOption(item.id)}
                        />
                        <Text style={styles.optionTitle}>{item.OptionName}</Text>
                        <Text style={styles.optionPrice}>
                            {Number(item.Price).toLocaleString('vi-VN')} ₫
                        </Text>
                    </View>
                )}
                ListHeaderComponent={
                    <View>
                        {service && service.image !== "" && (
                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: service && service.image }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                            </View>
                        )}
                        <View style={styles.serviceInfo}>
                            <Text style={styles.serviceTitle}>{service && service.title}</Text>
                            <Text style={styles.servicePrice}>
                                {Number(service && service.price).toLocaleString('vi-VN')} ₫
                            </Text>
                        </View>
                        <DatePicker
                            modal
                            open={open}
                            date={datetime}
                            onConfirm={(date) => {
                                setOpen(false)
                                setDatetime(date)
                            }}
                            onCancel={() => setOpen(false)}
                        />
                        <Text style={styles.totalOptionPrice}>Tổng giá tùy chọn: {optionPrice.toLocaleString('vi-VN')} ₫</Text> 
                        <Text style={styles.totalServicePrice}>
                            Tổng giá dịch vụ: {totalPrice.toLocaleString('vi-VN')} ₫
                        </Text> 
                    </View>
                }
            />
            <View style={styles.footer}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity 
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                        style={styles.quantityButtonContainer} // New style for button container
                    >
                        <Text style={styles.quantityButton}>-</Text>
                    </TouchableOpacity>
                    <View style={styles.quantityDisplayContainer}> 
                        <Text style={styles.quantityText}>{quantity}</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => setQuantity(quantity + 1)}
                        style={styles.quantityButtonContainer} // New style for button container
                    >
                        <Text style={styles.quantityButton}>+</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => handleAddToCart(service)} style={styles.addToCartButton}>
                    <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f0f0", // Slightly lighter background
    },
    footer: {
        paddingVertical: 15,
        paddingHorizontal: 25,
        backgroundColor: '#ffffff', // White background for contrast
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0, // Reduce top margin
        marginBottom: 10, // Optional: adjust bottom margin separately
    },
    quantityButton: {
        fontSize: 18, // Decrease font size for smaller display
        color: 'white',
        paddingHorizontal: 15,
    },
    quantityText: {
        fontSize: 24, // Increase font size for larger display
        color: '#333',
    },
    addToCartButton: {
        backgroundColor: '#ff6347',
        paddingVertical: 10, // Reduced padding
        borderRadius: 10, // Slightly smaller radius
        alignItems: 'center',
        marginVertical: 0, // Removed vertical margin
        elevation: 3, // Reduced shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addToCartText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
    },
    imageContainer: {
        marginBottom: 25,
        paddingHorizontal: 20,
    },
    image: {
        height: 250,
        width: '100%',
        borderRadius: 12,
    },
    serviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
        paddingHorizontal: 25,
    },
    serviceTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    servicePrice: {
        fontSize: 22,
        color: '#ff6347',
    },
    optionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3,
    },
    optionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 12,
    },
    optionPrice: {
        fontSize: 18,
        color: '#888',
        marginLeft: 'auto',
    },
    totalOptionPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginVertical: 12,
        paddingHorizontal: 25,
    },
    totalServicePrice: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 25,
        paddingHorizontal: 25,
    },
    quantityButtonContainer: {
        backgroundColor: '#ff6347',
        borderRadius: 5,
        width: 40, // Set width to make it square
        height: 40, // Set height to make it square
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    quantityDisplayContainer: {
        minWidth: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 5,
    },
});

export default Appointment;
