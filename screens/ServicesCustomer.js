import React, { useState, useEffect } from "react";
import { Image, TextInput, View, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import firestore from '@react-native-firebase/firestore';
import { SwiperFlatList } from 'react-native-swiper-flatlist';

const ServicesCustomer = ({ navigation }) => {
    const [initialServices, setInitialServices] = useState([]);
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');

    const filterByCategory = (category) => {
        if (category === 'all') {
            setServices(initialServices);
        } else {
            const result = initialServices.filter(service => service.type === category);
            setServices(result);
        }
    };

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('Services')
            .onSnapshot(querySnapshot => {
                const services = [];
                querySnapshot.forEach(documentSnapshot => {
                    services.push({
                        ...documentSnapshot.data(),
                        id: documentSnapshot.id,
                    });
                });
                setServices(services);
                setInitialServices(services);
            });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            const categorySnapshot = await firestore().collection('Type').get();
            const categoryList = categorySnapshot.docs.map(doc => doc.data().type);
            setCategories(categoryList);
        };

        fetchCategories();
    }, []);

    const handleAppointment = (service) => {
        navigation.navigate("Appointment", { service });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleAppointment(item)} style={styles.serviceItem}>
            <View style={styles.imageContainer}>
                {item.image !== "" && (
                    <Image
                        source={{ uri: item.image }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                    />
                )}
            </View>
            <View style={styles.textContainer}>
                <Text 
                    style={styles.serviceTitle}
                    numberOfLines={1}  // Limit to one line
                    ellipsizeMode="tail"  // Add ellipsis at the end
                >
                    {item.title}
                </Text>
                <Text style={styles.servicePrice}>
                    {Number(item.price).toLocaleString('vi-VN')} vnđ
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={services}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ListHeaderComponent={
                <>
                    <View style={{ backgroundColor: "white" }}>
                        <SwiperFlatList
                            style={{ width: '100%', height: 150 }}
                            autoplay
                            autoplayDelay={2}
                            autoplayLoop
                            index={0}
                            showPagination={false}  // Set this to false to remove the dots
                        >
                            <View style={styles.Viewimg}>
                                <Image style={styles.image} source={require("../assets/3-Fishsticks.jpg")}></Image>
                            </View>
                            <View style={styles.Viewimg}>
                                <Image style={styles.image} source={require("../assets/3-taro.jpg")}></Image>
                            </View>
                            <View style={styles.Viewimg}>
                                <Image style={styles.image} source={require("../assets/ga_2_mieng.png")}></Image>
                            </View>
                        </SwiperFlatList>
                        <View style={{ paddingLeft: 20, paddingRight: 20, marginTop: 20, marginBottom: 20 }}>
                            <TextInput
                                value={name}
                                placeholder="Tìm kiếm"
                                onChangeText={(text) => {
                                    setName(text);
                                    const result = initialServices.filter(service => service.title.toLowerCase().includes(text.toLowerCase()));
                                    setServices(result);
                                }}
                                style={styles.searchInput}
                            />
                        </View>
                        <View style={{ flexDirection: 'row', padding: 10 }}>
                            <TouchableOpacity style={[styles.categoryButton, { backgroundColor: '#f0f0f0' }]} onPress={() => filterByCategory('all')}>
                                <Text style={styles.categoryText}>Tất cả</Text>
                            </TouchableOpacity>
                            {categories.map((category, index) => (
                                <TouchableOpacity key={index} style={[styles.categoryButton, { backgroundColor: 'white' }]} onPress={() => filterByCategory(category)}>
                                    <Text style={styles.categoryText}>{category}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={{
                            padding: 15,
                            fontSize: 25,
                            fontWeight: "bold",
                        }}>
                            Danh sách dịch vụ
                        </Text>
                    </View>
                </>
            }
        />
    );
};

const styles = StyleSheet.create({
    rowitem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: "#F0F0F1"
    },
    Viewimg: {
        paddingLeft: 15,
        justifyContent: "center",
        alignSelf: "center",
    },
    image: {
        width: 390,
        height: 220,
    },
    categoryButton: {
        backgroundColor: 'white',
        width: 100,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    categoryText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    serviceItem: {
        flex: 1,
        margin: 10,
        padding: 15,
        borderRadius: 15,
        backgroundColor: 'white',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    imageContainer: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    serviceImage: {
        height: '100%',
        width: '100%',
        borderRadius: 10,
    },
    textContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    serviceTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: 'center',
    },
    servicePrice: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: 'center',
        marginTop: 5,
    },
    searchInput: {
        borderColor: "#0066cc",
        borderWidth: 1,
        borderRadius: 50,
        paddingHorizontal: 16,
        height: 60,
        fontSize: 20,
        marginVertical: 10,
        backgroundColor: '#f9f9f9',
    },
});

export default ServicesCustomer;
