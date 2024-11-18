import React, { useEffect, useState, useRef } from 'react';
import { View, PermissionsAndroid, Platform, Alert, TextInput, Button, Image, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import firestore from '@react-native-firebase/firestore';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

const GEOAPIFY_API_KEY = 'be8283f0ca404169924653620c942bfa';

const StoreLocationScreen = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [destination, setDestination] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const mapRef = useRef(null);
  const [storeLocations, setStoreLocations] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const route = useRoute();
  const { cartItems = [], totalAmount = 0, userInfo = {}, discountValue = 0 } = route.params || {};
  const navigation = useNavigation();

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Permission to access location',
            message: 'We need your location to show it on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentPosition();
        } else {
          Alert.alert('Location permission denied');
        }
      } else {
        getCurrentPosition(); // iOS automatically handles permissions
      }
    };

    const getCurrentPosition = () => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({ latitude, longitude });
        },
        (error) => {
          console.log(error);
          Alert.alert('Error', 'Unable to retrieve location. Please try again.');
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (currentPosition && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentPosition]);

  // Thêm hàm tính khoảng cách giữa 2 điểm
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Bán kính trái đất tính bằng km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Khoảng cách tính bằng km
  };

  // Sửa lại hàm handleMapPress
  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    setCurrentPosition({
      ...coordinate,
      isCurrentLocation: false
    });
    
    // Tìm cơ sở gần nhất
    let nearestStore = null;
    let shortestDistance = Infinity;
    
    storeLocations.forEach(store => {
      const distance = calculateDistance(
        coordinate.latitude,
        coordinate.longitude,
        parseFloat(store.latitude),
        parseFloat(store.longitude)
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestStore = store;
      }
    });

    if (nearestStore) {
      const storeCoordinate = {
        latitude: parseFloat(nearestStore.latitude),
        longitude: parseFloat(nearestStore.longitude)
      };
      setDestination(storeCoordinate);
      
      // Lấy và vẽ đường đi
      const route = await getRouteFromGeoapify(coordinate, storeCoordinate);
      setRouteCoordinates(route);
      
      // Hiển thị thông tin
      Alert.alert(
        'Cơ sở gần nhất',
        `${nearestStore.name}\n${nearestStore.address}\nKhoảng cách: ${shortestDistance.toFixed(2)} km`
      );
    }

    // Chuyển đổi tọa độ thành địa chỉ cho điểm xuất phát
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${coordinate.latitude}&lon=${coordinate.longitude}&apiKey=${GEOAPIFY_API_KEY}&lang=vi`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const addressData = data.features[0].properties;
        const formattedAddress = [
          addressData.housenumber,
          addressData.street,
          addressData.district,
          addressData.city,
          addressData.country
        ].filter(Boolean).join(', ');
        
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      Alert.alert('Error', 'Không thể lấy địa chỉ. Vui lòng thử lại.');
    }
  };

  const getRouteFromGeoapify = async (start, end) => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/routing?waypoints=${start.latitude},${start.longitude}|${end.latitude},${end.longitude}&mode=drive&apiKey=${GEOAPIFY_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Chuyển đổi coordinates từ Geoapify ([lon, lat]) sang định dạng của React Native Maps (latitude, longitude)
        const routeCoordinates = data.features[0].geometry.coordinates[0].map(point => ({
          latitude: point[1],
          longitude: point[0]
        }));
        
        // Vẽ đường đi bằng Polyline
        return routeCoordinates;
      }
    } catch (error) {
      console.error('Error getting route:', error);
      Alert.alert('Error', 'Không thể lấy đường đi. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    const fetchStoreLocations = async () => {
      try {
        const snapshot = await firestore()
          .collection('base')
          .get();
        
        const locations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setStoreLocations(locations);
      } catch (error) {
        console.error('Error fetching store locations:', error);
        Alert.alert('Error', 'Không thể lấy dữ liệu cửa hàng từ database');
      }
    };

    fetchStoreLocations();
  }, []);

  const getAddressSuggestions = async (text) => {
    try {
      setAddress(text);
      if (text.length < 3) { // Chỉ tìm kiếm khi có ít nhất 3 ký tự
        setAddressSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&format=json&apiKey=${GEOAPIFY_API_KEY}&lang=vi&filter=countrycode:vn`
      );
      
      const data = await response.json();
      
      if (data.results) {
        setAddressSuggestions(data.results);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const handleSelectAddress = async (suggestion) => {
    const { lat, lon } = suggestion;
    const selectedPosition = {
      latitude: lat,
      longitude: lon
    };
    
    setCurrentPosition(selectedPosition);
    setAddress(suggestion.formatted);
    setShowSuggestions(false);
    
    // Tìm cơ sở gần nhất từ vị trí đã chọn
    let nearestStore = null;
    let shortestDistance = Infinity;
    
    storeLocations.forEach(store => {
      const distance = calculateDistance(
        lat,
        lon,
        parseFloat(store.latitude),
        parseFloat(store.longitude)
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestStore = store;
      }
    });

    if (nearestStore) {
      const storeCoordinate = {
        latitude: parseFloat(nearestStore.latitude),
        longitude: parseFloat(nearestStore.longitude)
      };
      setDestination(storeCoordinate);
      
      const route = await getRouteFromGeoapify(selectedPosition, storeCoordinate);
      setRouteCoordinates(route);
      
      Alert.alert(
        'Cơ sở gần nhất',
        `${nearestStore.name}\n${nearestStore.address}\nKhoảng cách: ${shortestDistance.toFixed(2)} km`
      );
    }
  };

  const handleOrder = async () => {
    if (!currentPosition || !address) {
      Alert.alert('Thông báo', 'Vui lòng chọn địa chỉ trước khi xác nhận');
      return;
    }

    if (!cartItems.length || !userInfo.email) {
      Alert.alert('Thông báo', 'Không có thông tin đơn hàng hoặc người dùng');
      console.log(cartItems, userInfo);
      return;
    }

    // Tìm cơ sở gần nhất
    let nearestStore = null;
    let shortestDistance = Infinity;
    
    storeLocations.forEach(store => {
      const distance = calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        parseFloat(store.latitude),
        parseFloat(store.longitude)
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestStore = store;
      }
    });

    if (!nearestStore) {
      Alert.alert('Thông báo', 'Không tìm thấy cơ sở phù hợp');
      return;
    }

    try {
      const services = cartItems.map(item => ({
        title: item.title,
        quantity: item.quantity,
        options: item.options
      }));

      const appointmentData = {
        email: userInfo.email,
        fullName: userInfo.fullName,
        services,
        totalPrice: totalAmount,
        phone: userInfo.phone,
        datetime: new Date(),
        state: "pending",
        address: address,
        location: {
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude
        },
        discountValue: discountValue,
        store: {
          id: nearestStore.id,
          name: nearestStore.name,
          address: nearestStore.address,
          distance: shortestDistance.toFixed(2)
        }
      };

      const APPOINTMENTs = firestore().collection("Appointments");
      const docRef = await APPOINTMENTs.add(appointmentData);

      Alert.alert(
        'Thành công',
        'Đơn hàng đã được đặt thành công! Bạn có muốn thanh toán ngay không?',
        [
          {
            text: 'Thanh toán sau',
            onPress: () => {
              navigation.navigate('Appointments');
            },
            style: 'cancel',
          },
          {
            text: 'Thanh toán ngay',
            onPress: () => {
              navigation.navigate('PaymentZalo', {
                cartItems: cartItems,
                totalAmount: totalAmount,
                userInfo: userInfo,
                appointmentId: docRef.id, // Truyền ID đơn hàng sang trang thanh toán
                address: address
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Lỗi', 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
  };

  return (
    <View style={{ 
      flex: 1,
      backgroundColor: 'white',
    }}>
      <View style={{ margin: 10 }}>
        <TextInput
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            paddingLeft: 8,
            marginBottom: showSuggestions ? 0 : 10,
            borderRadius: 5
          }}
          placeholder="Nhập địa chỉ"
          value={address}
          onChangeText={(text) => getAddressSuggestions(text)}
        />
        
        {/* Danh sách gợi ý địa chỉ */}
        {showSuggestions && addressSuggestions.length > 0 && (
          <View style={{
            maxHeight: 200,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: 'gray',
            marginBottom: 10,
            borderRadius: 5
          }}>
            {addressSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee'
                }}
                onPress={() => handleSelectAddress(suggestion)}
              >
                <Text>{suggestion.formatted}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Button
          title="Lấy vị trí hiện tại"
          onPress={async () => {
            Geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                const currentCoordinate = { 
                  latitude, 
                  longitude,
                  isCurrentLocation: true
                };
                setCurrentPosition(currentCoordinate);

                // Tìm cơ sở gần nhất
                let nearestStore = null;
                let shortestDistance = Infinity;
                
                storeLocations.forEach(store => {
                  const distance = calculateDistance(
                    latitude,
                    longitude,
                    parseFloat(store.latitude),
                    parseFloat(store.longitude)
                  );
                  
                  if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestStore = store;
                  }
                });

                if (nearestStore) {
                  const storeCoordinate = {
                    latitude: parseFloat(nearestStore.latitude),
                    longitude: parseFloat(nearestStore.longitude)
                  };
                  setDestination(storeCoordinate);
                  
                  // Lấy và vẽ đường đi
                  const route = await getRouteFromGeoapify(currentCoordinate, storeCoordinate);
                  setRouteCoordinates(route);
                  
                  // Hiển thị thông tin
                  Alert.alert(
                    'Cơ sở gần nhất',
                    `${nearestStore.name}\n${nearestStore.address}\nKhoảng cách: ${shortestDistance.toFixed(2)} km`
                  );
                }

                // Chuyển đổi tọa độ thành địa chỉ cho điểm xuất phát
                try {
                  const response = await fetch(
                    `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=${GEOAPIFY_API_KEY}&lang=vi`
                  );
                  const data = await response.json();
                  
                  if (data.features && data.features.length > 0) {
                    const addressData = data.features[0].properties;
                    // Tạo địa chỉ đầy đủ từ dữ liệu
                    const formattedAddress = [
                      addressData.housenumber,
                      addressData.street,
                      addressData.district,
                      addressData.city,
                      addressData.country
                    ].filter(Boolean).join(', ');
                    
                    setAddress(formattedAddress); // Cập nhật ô nhập địa chỉ
                  }
                } catch (error) {
                  console.log(error);
                  Alert.alert('Error', 'Không thể lấy địa chỉ. Vui lòng thử lại.');
                }
              },
              (error) => {
                console.log(error);
                Alert.alert('Error', 'Không thể lấy vị trí. Vui lòng thử lại.');
              },
              { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );
          }}
        />
      </View>
      
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 10.980724795723445,
          longitude: 106.67531866840427,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        onPress={handleMapPress}
      >
        {/* Only show marker if location was selected by tapping the map */}
        {currentPosition && !currentPosition.isCurrentLocation && (
          <Marker
            coordinate={currentPosition}
            title={"Vị trí nhận hàng"}
            description={address}
            pinColor="red"
          />
        )}

        {destination && (
          <Marker
            coordinate={destination}
            title={"Điểm đến"}
            pinColor="blue"
          />
        )}

        {currentPosition && destination && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={3}
            strokeColor="blue"
          />
        )}

        {storeLocations.map(store => (
          <Marker
            key={store.id}
            coordinate={{
              latitude: parseFloat(store.latitude),
              longitude: parseFloat(store.longitude)
            }}
            title={store.name}
            description={store.address}
            pinColor="green"
          />
        ))}
      </MapView>

      {/* Thêm nút xác nhận ở dưới */}
      <View style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
          onPress={handleOrder}
        >
          <Text style={{
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold'
          }}>Xác nhận đặt hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Thay thế navigation options cũ
StoreLocationScreen.navigationOptions = {
  headerShown: false
};

export default StoreLocationScreen;