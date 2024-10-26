import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
import { useCart } from "../routers/CartContext"
import { Button } from 'react-native-paper';
import { useMyContextProvider } from "../index"
import firestore from "@react-native-firebase/firestore"
import colors from '../screens/colors'
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook

const MAX_TITLE_LENGTH = 20; // Độ dài tối đa của tên sản phẩm

const truncateTitle = (title) => {
    if (title.length > MAX_TITLE_LENGTH) {
        return title.substring(0, MAX_TITLE_LENGTH - 3) + '...'; // Cắt tên và thêm dấu ba chấm
    }
    return title;
};

const Cart = () => {
  const { cart, removeFromCart, clearCart, updateQuantity, addToCart1, addQuantity } = useCart(); // Ensure updateQuantity is destructured here

  // Debugging: Check if updateQuantity is defined
  console.log("updateQuantity:", updateQuantity);

  const [datetime, setDatetime] = useState(new Date()); // Khởi tạo datetime với thời gian hiện tại

  useEffect(() => {
    setDatetime(new Date()); // Cập nhật datetime khi component được mount
  }, []);

  const [promotionCode, setPromotionCode] = useState('');
  const [discountValue, setDiscountValue] = useState(0); // State to store discount value

  const renderItem = ({ item }) => {
    const totalItemPrice = (item.price * item.quantity) + (item.options.reduce((sum, option) => sum + (option.price * item.quantity), 0));

    return (
      <View style={styles.item}>
        <Image source={{ uri: item.image }} style={styles.image} />
        <View style={styles.details}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{truncateTitle(item.title)}</Text>
            {item.options && item.options.length > 0 && (
              <View style={styles.optionsContainer}>
                {item.options.map(option => (
                  <Text key={option.id} style={styles.optionText}>
                    {option.name}
                  </Text>
                ))}
              </View>
            )}
          </View>
          <View style={styles.bottomContainer}>
            <Text style={styles.price}>{totalItemPrice.toLocaleString('vi-VN')} vnđ</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity onPress={() => decreaseQuantity(item.id, item.options)}>
                <Text style={styles.quantityButton}>-</Text>
              </TouchableOpacity>
              <Text>{item.quantity}</Text>
              <TouchableOpacity onPress={() => increaseQuantity(item.id, item.options)}>
                <Text style={styles.quantityButton}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.id, item.options)} style={styles.removeButtonContainer}>
              <Text style={styles.removeButton}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const [controller, dispatch] = useMyContextProvider()  
  const { userLogin } = controller 
  
  const APPOINTMENTs = firestore().collection("Appointments")

  const increaseQuantity = (id,options) => {
    const item = cart.find(item => item.id === id && JSON.stringify(item.options) === JSON.stringify(options));
    if (item) {
      console.log("Increasing quantity for item:", item);
      updateQuantity(id, item.quantity + 1,item.options); // Update quantity when '+' is pressed
    }
  };

  const decreaseQuantity = (id,options) => {
    const item = cart.find(item => item.id === id && JSON.stringify(item.options) === JSON.stringify(options) );
    if (item && item.quantity > 1) {
      console.log("Decreasing quantity for item:", item.options);
      updateQuantity(id, item.quantity - 1,item.options); // Update quantity when '-' is pressed
    }
  };

  const handleSubmit = () => {
    const services = cart.map(item => ({
      title: item.title,
      quantity: item.quantity,
      options: item.options // Thêm tùy chọn vào dịch vụ
    }));

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity) + item.options.reduce((optionSum, option) => optionSum + (option.price * item.quantity), 0), 0);

    APPOINTMENTs
      .add({
        email: userLogin.email,
        fullName: userLogin.fullName,
        services,
        totalPrice,
        phone: userLogin.phone,
        datetime,
        state: "new"
      })
      .then(r => {
        APPOINTMENTs.doc(r.id).update({ id: userLogin.email });
        // navigation.navigate("Appointments");
      });
  }

  const total = cart.reduce((sum, item) => {
    // Tính tổng giá cho từng sản phẩm bao gồm cả giá của các tùy chọn
    const totalItemPrice = (item.price * item.quantity) + (item.options.reduce((optionSum, option) => optionSum + (option.price * item.quantity), 0));
    return sum + totalItemPrice; // Cộng dồn tổng giá
  }, 0);

  const navigation = useNavigation(); // Initialize navigation

  const checkPromotionCode = async () => {
    try {
      const discountCollection = firestore().collection('Discount');
      const querySnapshot = await discountCollection.where('code', '==', promotionCode).get();

      if (!querySnapshot.empty) {
        const discountDoc = querySnapshot.docs[0];
        const discountData = discountDoc.data();
        const conditionProduct = discountData.condition?.product;
        const productInCart = cart.some(item => item.id === conditionProduct);
  
        // Check if the condition exists and is met, or if there is no condition
        if (!discountData.condition || total >= parseInt(discountData.condition.total, 10)) {
          // Check the type
          if (discountData.type === '*') {
            const discountAmount = total * (discountData.value / 100);
            alert(`Mã khuyến mãi hợp lệ! Giảm giá: ${discountData.value}%`);
            setDiscountValue(discountAmount);
          } else if (discountData.type === '-') {
            alert(`Mã khuyến mãi hợp lệ! Giảm giá: ${discountData.value} VNĐ`);
            setDiscountValue(discountData.value);
          }
        } if (productInCart) {
          // Check the type
          if (discountData.type === '*') {
            const discountAmount = total * (discountData.value / 100);
            alert(`Mã khuyến mãi hợp lệ! Giảm giá: ${discountData.value}%`);
            setDiscountValue(discountAmount);
          } else if (discountData.type === '-') {
            alert(`Mã khuyến mãi hợp lệ! Giảm giá: ${discountData.value} VNĐ`);
            setDiscountValue(discountData.value);
          }
        } else if (!productInCart) {
          alert('Mã chỉ áp dụng với sản phẩm yêu cầu.');
        } else if (discountData.condition?.total) {
          alert(`Tổng giá phải đạt tối thiểu ${parseInt(discountData.condition.total, 10).toLocaleString('vi-VN')} VNĐ để áp dụng mã khuyến mãi.`);
        }
      } else {
        alert('Mã khuyến mãi không tồn tại.');
      }
    } catch (error) {
      console.error('Error checking promotion code:', error);
      alert('Có lỗi xảy ra khi kiểm tra mã khuyến mãi.');
    }
  };

  const totalWithDiscount = total - discountValue;

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
      />
      <Text style={styles.total}>Tổng cộng: {totalWithDiscount.toLocaleString('vi-VN')} VNĐ</Text> 
      
      <View style={styles.promotionContainer}>
        <TextInput
          style={styles.promotionInput}
          placeholder="Nhập mã khuyến mãi"
          value={promotionCode}
          onChangeText={setPromotionCode}
        />
        <TouchableOpacity style={styles.applyButton} onPress={checkPromotionCode}>
          <Text style={styles.applyButtonText}>Áp dụng</Text>
        </TouchableOpacity>
      </View>
      {/* <Button
        style={[styles.button, styles.orderButton]}
        textColor="white"
        mode="contained"
        onPress={handleSubmit}
      >
        Đặt Hàng
      </Button> */}
      <TouchableOpacity
        style={[styles.button, styles.orderButton]}
        onPress={handleSubmit}
      >
        <Text style={styles.buttonText}>Đặt Hàng</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={clearCart}
      >
        <Text style={styles.buttonText}>Xóa giỏ hàng</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.mapButton]} // Add a new style for the map button
        onPress={() => navigation.navigate('Map')} // Navigate to the Map screen
      >
        <Text style={styles.buttonText}>Xem Bản Đồ</Text>
      </TouchableOpacity>
            {/* <TouchableOpacity
        style={[styles.button, styles.mapButton]} // Add a new style for the map button
        onPress={() => navigation.navigate('Payment')} // Navigate to the Map screen
      >
            </TouchableOpacity> */}
            <TouchableOpacity
        style={[styles.button, styles.mapButton]} // Add a new style for the map button
        onPress={() => navigation.navigate('PaymentZalo')} // Navigate to the Map screen
      >
        <Text style={styles.buttonText}>Thanh toán</Text>
      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    height: 120, // Set a fixed height for uniformity
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  details: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  optionsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 5,
  },
  optionText: {
    fontSize: 12,
    color: 'gray',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Aligns items to the right
    marginTop: 5,
  },
  quantityButton: {
    fontSize: 18,
    color: '#ff6347',
    marginHorizontal: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6347',
    marginTop: 5,
  },
  removeButtonContainer: {
    alignItems: 'flex-end',
  },
  removeButton: {
    color: 'red',
    fontSize: 14,
  },
  total: {
    fontSize: 22, // Increased font size for emphasis
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    color: '#333',
  },
  clearButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  orderButton: {
    backgroundColor: 'orange',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  orderButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  textContainer: {
    marginBottom: 5,
  },
  bottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 10,
    width: '90%', // Ensures both buttons have the same width
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  header: {
    // Add any additional styles if needed
  },
  mapButton: {
    backgroundColor: 'blue', // Choose a color for the map button
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  promotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  promotionInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  applyButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Cart;
