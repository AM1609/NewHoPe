import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';

const StoreLocationScreen = () => {
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPosition({ latitude, longitude });
      },
      (error) => console.log(error),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 11.0036,
          longitude: 106.6729,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {currentPosition && (
          <Marker
            coordinate={currentPosition}
            title={"Thủ Dầu Một"}
            description={"Bình Dương, Việt Nam"}
          />
        )}
        <Marker
          coordinate={{ latitude: 10.9803, longitude: 106.6744 }} // Tọa độ của Trường Đại Học Thủ Dầu Một
          title={"Trường Đại Học Thủ Dầu Một"}
          description={"Địa chỉ: 6 Nguyễn Văn Tiết, Phú Hòa, Thủ Dầu Một, Bình Dương"}
        />
      </MapView>
    </View>
  );
};

export default StoreLocationScreen;