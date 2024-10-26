import React, { useState } from "react"
import { View, Image,StyleSheet, Alert } from "react-native"
import { Text, TextInput, Button } from "react-native-paper"
import firestore from '@react-native-firebase/firestore'
import storage from "@react-native-firebase/storage"
import ImagePicker from "react-native-image-crop-picker"
import { useMyContextProvider } from "../index"
import { black } from "react-native-paper/lib/typescript/styles/themes/v2/colors"


const AddNewService = ({navigation}) => {
    const [controller, dispatch] = useMyContextProvider()
    const {userLogin} = controller
    const [imagePath, setImagePath] = useState('')
    const [title, setTitle] = useState('')
    const [price, setPrice] = useState('')
    const [type, setType] = useState('')
    const [image, setImage] = useState('')
    const SERVICES = firestore().collection("Services")
    const TYPE = firestore().collection("Type")
    const handleAddNewService = () => {
        if (!imagePath) {
            Alert.alert("Lỗi", "Vui lòng chọn ảnh cho sản phẩm.");
            return;
        }
        if (!title.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập tên sản phẩm.");
            return;
        }
        if (!price.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập giá sản phẩm.");
            return;
        }

        SERVICES
        .add({
            title,
            price: price + '.000', // Added .000 to the price
            type,
            create: userLogin.email
        })
        .then(response =>{
            const refImage = storage().ref("/services/" + response.id + ".png")
            refImage.putFile(imagePath)
            .then(
                ()=>
                    refImage.getDownloadURL()
                    .then(link =>
                        {
                            SERVICES.doc(response.id).update({
                                id: response.id, 
                                image: link
                            })
                            Alert.alert("Thành công", "Sản phẩm đã được thêm thành công.", [
                                { text: "OK", onPress: () => navigation.navigate("Services") }
                            ]);
                        }
                    )
                )
            .catch(e => {
                console.log(e.message);
                Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
            })
        })
        .catch(e => {
            console.log(e.message);
            Alert.alert("Lỗi", "Không thể thêm sản phẩm. Vui lòng thử lại.");
        })
        TYPE
        .add({
            type
        })
        
    }
        
    const handleUploadImage = () =>{
        ImagePicker.openPicker({
            mediaType: "photo",
            width: 300, // Changed width to 300
            height: 300, // Changed height to 300
            cropping: true // Added cropping option
        })
        .then(image =>
            setImagePath(image.path)
        )
        .catch(e=> console.log(e.message))
    }

    const formatToVND = (value) => {
        // Remove non-digit characters
        const numericValue = value.replace(/\D/g, '');
        // Format to VND
        return numericValue ? numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '': '';
    }

    const handlePriceChange = (text) => {
        // Remove all non-digit characters
        const numericValue = text.replace(/\D/g, '');
        // Format and set the new value without moving the cursor
        const formattedValue = numericValue ? formatToVND(numericValue) : '';
        setPrice(formattedValue);
    }

    return (
        <View style={{ padding: 10, flex:1, backgroundColor:"white" }}>
            
            <Button textColor="black" buttonColor="orange" style={styles.button} mode="contained" onPress={handleUploadImage}>
                Upload Ảnh
            </Button>
            {((imagePath!= "")&&
            <Image source={{uri: imagePath}}
                style={{ width: 120, height: 120, borderRadius: 15, alignSelf:"center" }}
            />
            )}
            <Text style={styles.title}>Tên sản phẩm :</Text>
            <TextInput
                placeholder="Nhập tên sản phẩm"
                value={title}
                onChangeText={setTitle}
                style={styles.textinput}
            />
            <Text style={styles.title}>Giá :</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                    placeholder="0"
                    value={price}
                    onChangeText={handlePriceChange}
                    keyboardType="numeric"
                    style={[styles.textinput, { flex: 1 }]} // Thêm flex: 1 vào style
                    right={<TextInput.Affix text=".000 VNĐ" />} // Thêm dòng này để hiển thị .000 VNĐ
                />
            </View>
            <Text style={styles.title}>Loại sản phẩm :</Text>
            <TextInput
                placeholder="Loại sản phẩm"
                value={type}
                onChangeText={setType}
                style={styles.textinput}
            />
            <Button style={styles.buttonadd}  textColor="black" mode="contained" onPress={handleAddNewService}>Thêm sản phẩm</Button>
        </View>
    );
};
const styles = StyleSheet.create({
    title:{
        fontSize: 20, fontWeight: 'bold',paddingBottom:15
    },
    textinput:{
        fontSize:20,marginBottom: 10, borderWidth: 1, borderRadius:10
    },
    buttonadd:{
        margin: 40, 
        backgroundColor:"orange",
    },
    button:{
        margin:20, 
        backgroundColor:"orange",
        marginLeft:80,
        marginRight:80
    }
})
export default AddNewService;

