import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Dimensions, TouchableOpacity, Clipboard, Animated } from 'react-native';
import { Button, Text, IconButton } from 'react-native-paper';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

import { useMyContextProvider } from "../index";

const GEOAPIFY_API_KEY = 'be8283f0ca404169924653620c942bfa';

const DeliveryMap = ({ route, navigation }) => {
    const { order, orderId } = route.params;
    const [currentLocation, setCurrentLocation] = useState(null);
    const [orderLocation, setOrderLocation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const watchIdRef = useRef(null);
    const [controller] = useMyContextProvider();
    const { userLogin } = controller;
    const [shipperLocation, setShipperLocation] = useState(null);
    const mapRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const animatedHeight = useRef(new Animated.Value(1)).current;

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
                setIsLoading(false);
            },
            error => {
                console.error(error);
                setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );

        if (userLogin?.role === 'staff') {
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
                },
                error => console.error(error),
                { 
                    enableHighAccuracy: true, 
                    distanceFilter: 10,
                    interval: 5000,
                    fastestInterval: 3000
                }
            );
        }

        const unsubscribe = firestore()
            .collection('Appointments')
            .doc(orderId)
            .onSnapshot(doc => {
                const data = doc.data();
                if (data?.shipperLocation && order?.location) {
                    const { latitude, longitude } = data.shipperLocation;
                    const shipperPos = {
                        latitude,
                        longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    };
                    setShipperLocation(shipperPos);
                    
                    const destinationPos = {
                        latitude: order.location.latitude,
                        longitude: order.location.longitude
                    };
                    setOrderLocation(destinationPos);
                    getRouteFromGeoapify(shipperPos, destinationPos);
                }
            });

        return () => {
            if (watchIdRef.current !== null) {
                Geolocation.clearWatch(watchIdRef.current);
            }
            unsubscribe();
        };
    }, []);

    const updateLocationInFirestore = async (latitude, longitude) => {
        try {
            if (userLogin?.role === 'staff') {
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
            }
        } catch (error) {
            console.error('Error updating location:', error);
        }
    };

    const handleDelivered = async () => {
        if (userLogin?.role !== 'staff') {
            Alert.alert('Thông báo', 'Bạn không có quyền thực hiện thao tác này');
            return;
        }

        try {
            await firestore()
                .collection('Appointments')
                .doc(orderId)
                .update({
                    state: 'delivered',
                    deliveredAt: firestore.FieldValue.serverTimestamp(),
                    deliveredBy: auth().currentUser?.email || null,
                });
            
            Alert.alert(
                'Thành công',
                'Đơn hàng đã được giao thành công',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Appointments')
                    }
                ]
            );
        } catch (error) {
            console.error('Error marking as delivered:', error);
            Alert.alert('Error', 'Không thể cập nhật trạng thái đơn hàng');
        }
    };

    const copyToClipboard = (phone) => {
        if (phone) {
            Clipboard.setString(phone);
            Alert.alert('Thành công', 'Đã sao chép số điện thoại');
        }
    };

    const getRegionForCoordinates = (points) => {
        if (points.length === 0) return null;

        let minLat = points[0].latitude;
        let maxLat = points[0].latitude;
        let minLng = points[0].longitude;
        let maxLng = points[0].longitude;

        points.forEach(point => {
            minLat = Math.min(minLat, point.latitude);
            maxLat = Math.max(maxLat, point.latitude);
            minLng = Math.min(minLng, point.longitude);
            maxLng = Math.max(maxLng, point.longitude);
        });

        const midLat = (minLat + maxLat) / 2;
        const midLng = (minLng + maxLng) / 2;

        const deltaLat = (maxLat - minLat) * 1.5;
        const deltaLng = (maxLng - minLng) * 1.5;

        return {
            latitude: midLat,
            longitude: midLng,
            latitudeDelta: Math.max(deltaLat, 0.01),
            longitudeDelta: Math.max(deltaLng, 0.01),
        };
    };

    const fitMapToMarkers = () => {
        if (mapRef.current && shipperLocation && orderLocation) {
            mapRef.current.fitToCoordinates(
                [
                    {
                        latitude: shipperLocation.latitude,
                        longitude: shipperLocation.longitude
                    },
                    {
                        latitude: orderLocation.latitude,
                        longitude: orderLocation.longitude
                    }
                ],
                {
                    edgePadding: {
                        top: 50,
                        right: 50,
                        bottom: 50,
                        left: 50
                    },
                    animated: true
                }
            );
        }
    };

    useEffect(() => {
        if (shipperLocation && orderLocation) {
            fitMapToMarkers();
        }
    }, [shipperLocation, orderLocation]);

    const toggleBottomSheet = () => {
        const toValue = isExpanded ? 0 : 1;
        setIsExpanded(!isExpanded);
        
        Animated.spring(animatedHeight, {
            toValue,
            useNativeDriver: false,
            bounciness: 4
        }).start();
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
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: 10.762622,  // Default cho Việt Nam
                    longitude: 106.660172,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
            >
                {userLogin?.role === 'staff' && currentLocation && (
                    <Marker
                        coordinate={currentLocation}
                        title="Vị trí của bạn"
                        description="Shipper"
                        pinColor="blue"
                    />
                )}
                {shipperLocation && (
                    <Marker
                        coordinate={shipperLocation}
                        title="Vị trí shipper"
                        description="Shipper đang giao hàng"
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
            
            <Animated.View style={[
                styles.bottomContainer,
                {
                    maxHeight: animatedHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['20%', '35%']
                    })
                }
            ]}>
                <TouchableOpacity 
                    onPress={toggleBottomSheet}
                    style={styles.handleContainer}
                >
                    <View style={styles.handle} />
                </TouchableOpacity>

                <View style={styles.infoContainer}>
                    <Text style={styles.infoLabel}>Địa chỉ giao:</Text>
                    <Text style={styles.infoText} numberOfLines={isExpanded ? undefined : 1}>
                        {order?.address || 'Không có thông tin'}
                    </Text>
                </View>
                
                {isExpanded && (
                    <>
                        <View style={styles.infoContainer}>
                            <Text style={styles.infoLabel}>Số điện thoại:</Text>
                            <View style={styles.phoneContainer}>
                                <Text style={styles.infoText}>
                                    {order?.phone || 'Không có thông tin'}
                                </Text>
                                <Button
                                    mode="text"
                                    onPress={() => copyToClipboard(order?.phone)}
                                    style={styles.copyButton}
                                >
                                    Copy
                                </Button>
                            </View>
                        </View>
                        
                        {userLogin?.role === 'staff' && (
                            <Button
                                mode="contained"
                                onPress={handleDelivered}
                                style={styles.deliveredButton}
                            >
                                Xác nhận đã giao hàng
                            </Button>
                        )}
                    </>
                )}
            </Animated.View>
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
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingTop: 10,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#DEDEDE',
        borderRadius: 2,
    },
    infoContainer: {
        marginBottom: 15,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 16,
        color: '#000',
    },
    phoneContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    copyButton: {
        marginVertical: 0,
    },
    deliveredButton: {
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: '#4CAF50',
    },
});

DeliveryMap.navigationOptions = {
    tabBarStyle: { display: 'none' }
};

export default DeliveryMap;
