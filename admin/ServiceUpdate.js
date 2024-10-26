import React, { useState } from "react";
import { View, Image, StyleSheet } from 'react-native'
import {Text, TextInput, Button } from "react-native-paper";
import firestore from '@react-native-firebase/firestore';
import storage from "@react-native-firebase/storage";
import ImagePicker from "react-native-image-crop-picker";

const ServiceUpdate = ({ route, navigation }) => {
    const { service } = route.params;
    const [title, setTitle] = useState(service.title);
    const [price, setPrice] = useState(service.price);
    const [imagePath, setImagePath] = useState(service.image);

    const handleUpdateService = async () => {
        try {
            await firestore()
                .collection('Services')
                .doc(service.id)
                .update({
                    title: title,
                    price: price
                });
            if (imagePath !== service.image) {
                const refImage = storage().ref(`/services/${service.id}.png`);
                await refImage.putFile(imagePath);
                const imageLink = await refImage.getDownloadURL();
                await firestore()
                    .collection('Services')
                    .doc(service.id)
                    .update({
                        image: imageLink
                    });
            }

            navigation.goBack();
        } catch (error) {
            console.error("Lỗi khi cập nhật dịch vụ:", error);
        }
    }

    const handleUploadImage = () =>{
        ImagePicker.openPicker({
            mediaType: "photo",
            width: 400,
            height: 300
        })
        .then(image =>
            setImagePath(image.path)
        )
        .catch(e=> console.log(e.message))
    }

    return (
        <View style={styles.container}>
            {((imagePath !== "") &&
            <Image source={{uri: imagePath}}
                style={{height: 300}}
            />
            )}
            <Button style={styles.buttonadd} buttonColor="orange" textColor="black" mode="contained" onPress={handleUploadImage}>
                Đổi ảnh
            </Button>
            <Text style={styles.textsp}>Tên sản phẩm :</Text>
            <TextInput
                style={styles.textinput}
                value={title}
                onChangeText={setTitle}
                placeholder="Nhập tên sản phẩm"
            />
            <Text style={styles.textsp}>Giá :</Text>
            <TextInput
                style={styles.textinput}
                value={price}
                onChangeText={setPrice}
                placeholder="0"
                keyboardType="numeric"
            />
            <Button style={styles.buttonadd} buttonColor="orange" textColor="black" mode="contained" onPress={handleUpdateService}>
                Cập nhật
            </Button>
        </View>
    );
}
const styles = StyleSheet.create({
    container:{
        flex:1, backgroundColor:"white", padding:10
    },
    
    textsp:{
        fontSize: 20, fontWeight: 'bold', paddingBottom:10
    },
    textinput:{
        marginBottom: 10, borderWidth: 1, borderRadius:10
    },
    buttonadd:{
        marginLeft:80,
        marginRight:80,
        marginTop:20,
        backgroundColor:"orange",
    },
})
export default ServiceUpdate;
