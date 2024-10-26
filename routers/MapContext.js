
// import React, { useState, useCallback } from 'react';
// import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

// const containerStyle = {
//   width: '100%',
//   height: '400px'
// };

// const center = {
//   lat: 10.762622,
//   lng: 106.660172
// };

// function MapPicker() {
//   const [selectedPosition, setSelectedPosition] = useState(center);

//   const onMapClick = useCallback((event) => {
//     setSelectedPosition({
//       lat: event.latLng.lat(),
//       lng: event.latLng.lng()
//     });
//   }, []);

//   return (
//     <LoadScript googleMapsApiKey="AIzaSyAT5kk9MshG9hcagzK71GajUCu9G7F8u8c">
//       <GoogleMap
//         mapContainerStyle={containerStyle}
//         center={center}
//         zoom={10}
//         onClick={onMapClick}
//       >
//         <Marker position={selectedPosition} />
//       </GoogleMap>
//     </LoadScript>
//   );
// }

// export default MapPicker;

