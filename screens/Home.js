import React, { useState, useEffect } from "react";
import { Image, TextInput, View, FlatList, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from "react-native";
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
        <TouchableOpacity 
            onPress={() => handleAppointment(item)} 
            style={styles.serviceItem}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {item.image !== "" ? (
                    <Image
                        source={{ uri: item.image }}
                        style={styles.serviceImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>No Image</Text>
                    </View>
                )}
            </View>
            <View style={styles.textContainer}>
                <Text 
                    style={styles.serviceTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {item.title}
                </Text>
                <Text style={styles.servicePrice}>
                    {Number(item.price).toLocaleString('vi-VN')}đ
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={services}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <SwiperFlatList
                            style={styles.swiper}
                            autoplay
                            autoplayDelay={3}
                            autoplayLoop
                            index={0}
                        >
                            <View style={styles.Viewimg}>
                                <Image 
                                    style={styles.image} 
                                    source={require("../assets/3-Fishsticks.jpg")}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={styles.Viewimg}>
                                <Image 
                                    style={styles.image} 
                                    source={require("../assets/3-taro.jpg")}
                                    resizeMode="contain"
                                />
                            </View>
                            <View style={styles.Viewimg}>
                                <Image 
                                    style={styles.image} 
                                    source={require("../assets/ga_2_mieng.png")}
                                    resizeMode="contain"
                                />
                            </View>
                        </SwiperFlatList>

                        <View style={styles.searchContainer}>
                            <View style={styles.searchWrapper}>
                                <TextInput
                                    value={name}
                                    placeholder="Tìm kiếm dịch vụ..."
                                    placeholderTextColor="#666"
                                    onChangeText={(text) => {
                                        setName(text);
                                        const result = initialServices.filter(service => 
                                            service.title.toLowerCase().includes(text.toLowerCase())
                                        );
                                        setServices(result);
                                    }}
                                    style={styles.searchInput}
                                />
                                <View style={styles.searchIcon}>
                                    {/* Add your search icon here */}
                                </View>
                            </View>
                        </View>

                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoriesContainer}
                        >
                            <TouchableOpacity 
                                style={[styles.categoryButton, { backgroundColor: '#ff6347' }]} 
                                onPress={() => filterByCategory('all')}
                            >
                                <Text style={[styles.categoryText, { color: '#fff' }]}>Tất cả</Text>
                            </TouchableOpacity>
                            {categories.map((category, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.categoryButton} 
                                    onPress={() => filterByCategory(category)}
                                >
                                    <Text style={styles.categoryText}>{category}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.sectionTitle}>
                            Danh sách dịch vụ
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        backgroundColor: '#fff',
        paddingBottom: 10,
    },
    swiper: {
        height: 200,
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    searchWrapper: {
        position: 'relative',
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchInput: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    searchIcon: {
        padding: 10,
    },
    categoriesContainer: {
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    categoryButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    columnWrapper: {
        paddingHorizontal: 10,
        justifyContent: 'space-between',
    },
    serviceItem: {
        width: '47%',
        marginHorizontal: 5,
        marginBottom: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    imageContainer: {
        width: '100%',
        height: 150,
        backgroundColor: '#f5f5f5',
    },
    serviceImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#999',
        fontSize: 14,
    },
    textContainer: {
        padding: 12,
    },
    serviceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    servicePrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 5,
    },
    Viewimg: {
        width: Dimensions.get('window').width,
        height: 200,
    },
    image: {
        width: '100%',
        height: '100%',
    },
});

export default ServicesCustomer;
