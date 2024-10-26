import React from "react"
import { View, Image, StyleSheet } from "react-native"
import { Text } from "react-native-paper"

const ServiceDetail = ({ route }) => {
    const { service } = route.params
    return (
        <View style={styles.container}>
            <View style={styles.viewtext}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Tên món: </Text>
                <Text style={{ fontSize: 20}}>{service.title}</Text>
            </View>
            
            <View style={styles.viewtext}>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Giá: </Text>
                <Text style={{ fontSize: 20}}>{service.price} ₫</Text>
            </View>
            {service.image !== "" && (
                <View>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Ảnh: </Text>
                    <Image
                        source={{ uri: service.image }}
                        style={{ height: 300, width: '100%'}}
                        resizeMode="contain"
                    />
                    
                </View>
            )}
        </View>
    )
}
const styles = StyleSheet.create({
    container:{
        flex:1, backgroundColor:"white", padding:10
    },
    viewtext:{
        flexDirection: 'row', paddingBottom:10
    },
    
})
export default ServiceDetail;
