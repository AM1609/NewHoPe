import React, { useEffect, useState, useRef } from 'react';
import { View, PermissionsAndroid, Platform, Alert, TextInput, Button } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const GEOAPIFY_API_KEY = 'be8283f0ca404169924653620c942bfa';

const StoreLocationScreen = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [address, setAddress] = useState('');
  const mapRef = useRef(null);

  const getCoordinatesFromAddress = async (address) => {
    try {
      if (!address.trim()) {
        Alert.alert('Error', 'Vui lòng nhập địa chỉ');
        return;
      }

      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${GEOAPIFY_API_KEY}&lang=vi`
      );
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].geometry.coordinates;
        setCurrentPosition({ latitude, longitude });

        const addressData = data.features[0].properties;
        const formattedAddress = [
          addressData.housenumber,
          addressData.street,
          addressData.district,
          addressData.city,
          addressData.country
        ].filter(Boolean).join(', ');
        
        setAddress(formattedAddress);
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        console.log(`Address: ${formattedAddress}`);
      } else {
        Alert.alert('Error', 'Không tìm thấy địa chỉ. Vui lòng thử lại với địa chỉ khác.');
      }
    } catch (error) {
      console.error('Error details:', error);
      Alert.alert('Error', 'Không thể lấy tọa độ. Vui lòng kiểm tra kết nối mạng và thử lại.');
    }
  };

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
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  }, [currentPosition]);

  // Thêm hàm xử lý khi người dùng bấm vào bản đồ
  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    setCurrentPosition(coordinate);

    // Chuyển đổi tọa độ thành địa chỉ
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${coordinate.latitude}&lon=${coordinate.longitude}&apiKey=${GEOAPIFY_API_KEY}&lang=vi`
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
        console.log(`Selected location: ${formattedAddress}`);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      Alert.alert('Error', 'Không thể lấy địa chỉ. Vui lòng thử lại.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, margin: 10, paddingLeft: 8 }}
        placeholder="Nhập địa chỉ"
        value={address}
        onChangeText={setAddress}
      />
      <Button
        title="Tìm tọa độ"
        onPress={() => getCoordinatesFromAddress(address)}
      />
      <Button
        title="Lấy vị trí hiện tại"
        onPress={async () => {
          Geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentPosition({ latitude, longitude });

              // Chuyển đổi tọa độ thành địa chỉ sử dụng Geoapify
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
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 11.0036,
          longitude: 106.6729,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        onPress={handleMapPress}
      >
        {currentPosition && (
          <Marker
            coordinate={currentPosition}
            title={"Vị trí đã chọn"}
            description={address}
          />
        )}
      </MapView>
    </View>
  );
};

export default StoreLocationScreen;