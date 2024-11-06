import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { Button, Text } from 'react-native-paper';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import firestore from '@react-native-firebase/firestore';

const GEOAPIFY_API_KEY = 'be8283f0ca404169924653620c942bfa';

const DeliveryMap = ({ route, navigation }) => {
    const { order, orderId } = route.params;
    const [currentLocation, setCurrentLocation] = useState(null);
    const [orderLocation, setOrderLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const watchIdRef = useRef(null);

    const getRouteFromGeoapify = async (start, end) => {
        try {
            const response = await fetch(
                `https://api.geoapify.com/v1/routing?waypoints=${start.latitude},${start.longitude}|${end.latitude},${end.longitude}&mode=drive&details=instruction&type=short&apiKey=${GEOAPIFY_API_KEY}`
            );
            
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                const allCoordinates = [];
                data.features.forEach(feature => {
                    if (feature.geometry && feature.geometry.coordinates) {
                        feature.geometry.coordinates.forEach(coord => {
                            if (Array.isArray(coord)) {
                                if (Array.isArray(coord[0])) {
                                    coord.forEach(point => {
                                        allCoordinates.push({
                                            latitude: point[1],
                                            longitude: point[0]
                                        });
                                    });
                                } else {
                                    allCoordinates.push({
                                        latitude: coord[1],
                                        longitude: coord[0]
                                    });
                                }
                            }
                        });
                    }
                });

                const uniqueCoordinates = allCoordinates.filter((coord, index, self) =>
                    index === self.findIndex((c) => (
                        c.latitude === coord.latitude && c.longitude === coord.longitude
                    ))
                );

                setRouteCoordinates(uniqueCoordinates);
            } else {
                console.error('No route found');
                Alert.alert('Error', 'Không thể tìm thấy đường đi phù hợp');
            }
        } catch (error) {
            console.error('Error getting route:', error);
            Alert.alert('Error', 'Không thể lấy đường đi. Vui lòng thử lại.');
        }
    };

    useEffect(() => {
        Geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                const currentPos = {
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };
                setCurrentLocation(currentPos);
                
                if (order?.location) {
                    const orderPos = {
                        latitude: order.location.latitude,
                        longitude: order.location.longitude
                    };
                    setOrderLocation(orderPos);
                    getRouteFromGeoapify(currentPos, orderPos);
                }
                setIsLoading(false);
            },
            error => {
                console.error(error);
                setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        watchIdRef.current = Geolocation.watchPosition(
            position => {
                const { latitude, longitude } = position.coords;
                const newLocation = {
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };
                setCurrentLocation(newLocation);
                
                updateLocationInFirestore(latitude, longitude);
                
                if (order?.location) {
                    getRouteFromGeoapify(newLocation, {
                        latitude: order.location.latitude,
                        longitude: order.location.longitude
                    });
                }
            },
            error => console.error(error),
            { 
                enableHighAccuracy: true, 
                distanceFilter: 10,
                interval: 5000,
                fastestInterval: 3000
            }
        );

        return () => {
            if (watchIdRef.current !== null) {
                Geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    const updateLocationInFirestore = async (latitude, longitude) => {
        try {
            await firestore()
                .collection('Appointments')
                .doc(orderId)
                .update({
                    shipperLocation: {
                        latitude,
                        longitude,
                        timestamp: firestore.FieldValue.serverTimestamp(),
                    },
                });
        } catch (error) {
            console.error('Error updating location:', error);
        }
    };

    const handleDelivered = async () => {
        try {
            await firestore()
                .collection('Appointments')
                .doc(orderId)
                .update({
                    state: 'delivered',
                    deliveredAt: firestore.FieldValue.serverTimestamp(),
                });
            
            Alert.alert(
                'Thành công',
                'Đơn hàng đã được giao thành công',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            console.error('Error marking as delivered:', error);
            Alert.alert('Error', 'Không thể cập nhật trạng thái đơn hàng');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Đang tải bản đồ...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={currentLocation}
            >
                {currentLocation && (
                    <Marker
                        coordinate={currentLocation}
                        title="Vị trí của bạn"
                        description="Shipper"
                        pinColor="blue"
                    />
                )}
                {orderLocation && (
                    <Marker
                        coordinate={orderLocation}
                        title="Địa chỉ giao hàng"
                        description={order?.address || 'Địa chỉ khách hàng'}
                        pinColor="red"
                    />
                )}
                {routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeWidth={4}
                        strokeColor="#2196F3"
                        geodesic={true}
                        lineDashPattern={[1]}
                    />
                )}
            </MapView>
            
            <View style={styles.bottomContainer}>
                <View style={styles.infoContainer}>
                    <Text style={styles.infoLabel}>Địa chỉ giao:</Text>
                    <Text style={styles.infoText}>
                        {order?.address || 'Không có thông tin'}
                    </Text>
                </View>
                
                <View style={styles.infoContainer}>
                    <Text style={styles.infoLabel}>Số điện thoại:</Text>
                    <Text style={styles.infoText}>
                        {order?.phone || 'Không có thông tin'}
                    </Text>
                </View>
                
                <Button
                    mode="contained"
                    onPress={handleDelivered}
                    style={styles.deliveredButton}
                >
                    Xác nhận đã giao hàng
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    infoContainer: {
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    deliveredButton: {
        marginTop: 15,
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
    },
});

DeliveryMap.navigationOptions = {
    tabBarStyle: { display: 'none' }
};

export default DeliveryMap;
