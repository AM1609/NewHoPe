import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Alert } from 'react-native';
import { useCart } from "../routers/CartContext"
import { Button } from 'react-native-paper';
import { useMyContextProvider } from "../index"
import firestore from "@react-native-firebase/firestore"
import colors from '../routers/colors'
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
            <Text style={styles.price}>{totalItemPrice.toLocaleString('vi-VN')} ₫</Text>
            {item.options && item.options.length > 0 && (
              <View style={styles.optionsContainer}>
                {item.options.map(option => (
                  <Text key={option.id} style={styles.optionText}>
                    • {option.name}
                  </Text>
                ))}
              </View>
            )}
          </View>
          <View style={styles.actionContainer}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={() => decreaseQuantity(item.id, item.options)}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={() => increaseQuantity(item.id, item.options)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              onPress={() => removeFromCart(item.id, item.options)} 
              style={styles.removeButton}
            >
              <Text style={styles.removeButtonText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const [controller, dispatch] = useMyContextProvider()  
  const { userLogin } = controller 

  // Add this check for employee role
  const isEmployee = userLogin?.role === 'staff';
  console.log('User Role:', userLogin?.role); // Thêm log để debug

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

        // Kiểm tra điều kiện sản phẩm trước
        if (conditionProduct && !productInCart) {
          alert('Mã chỉ áp dụng với sản phẩm yêu cầu.');
          return;
        }

        // Kiểm tra điều kiện tổng tiền
        if (discountData.condition?.total && total < parseInt(discountData.condition.total, 10)) {
          alert(`Tổng giá phải đạt tối thiểu ${parseInt(discountData.condition.total, 10).toLocaleString('vi-VN')} VNĐ để áp dụng mã khuyến mãi.`);
          return;
        }

        // Nếu không có điều kiện hoặc đã thỏa mãn điều kiện thì áp dụng giảm giá
        if (discountData.type === '*') {
          const discountAmount = total * (discountData.value / 100);
          Alert.alert("Thông báo",`Mã khuyến mãi hợp lệ! Giảm giá: ${discountData.value}%`);
          setDiscountValue(discountAmount);
        } else if (discountData.type === '-') {
          alert(`Mã khuyến mãi hợp lệ! Giảm giá: ${discountData.value} VNĐ`);
          setDiscountValue(discountData.value);
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

  // Thêm hàm kiểm tra giỏ hàng
  const checkCartEmpty = () => {
    if (cart.length === 0) {
      Alert.alert(
        'Giỏ hàng trống',
        'Vui lòng thêm sản phẩm vào giỏ hàng trước khi tiếp tục.',
        [{ text: 'OK' }]
      );
      return true;
    }
    return false;
  };

  // Thêm hàm tạo đơn hàng
  const createOrder = async () => {
    try {
        const services = cart.map(item => ({
            title: item.title,
            quantity: item.quantity,
            options: item.options
        }));

        const orderData = {
            email: userLogin.email,
            fullName: userLogin.fullName,
            services,
            totalPrice: totalWithDiscount,
            phone: userLogin.phone,
            datetime: new Date(),
            state: "new",
            discountValue: discountValue
        };

        const APPOINTMENTs = firestore().collection("Appointments");
        const docRef = await APPOINTMENTs.add(orderData);

        // Sửa lại phần này: sử dụng docRef.id thay vì generateOrderId()
        navigation.navigate('PaymentQR', {
            orderId: docRef.id,  // Thay đổi ở đây
            amount: totalWithDiscount,
            userInfo: userLogin
        });

    } catch (error) {
        console.error('Error creating order:', error);
        Alert.alert('Lỗi', 'Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
  };

  const handleClearCart = () => {
    clearCart();
    setDiscountValue(0); // Đặt lại giá trị giảm giá về 0
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={cart}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
      />
      {discountValue > 0 && (
        <Text style={styles.total}>
          <Text style={styles.discountedPrice}>
            Trước giảm: {total.toLocaleString('vi-VN')} VNĐ
          </Text>
          {'\n'}
          Phải trả: {totalWithDiscount.toLocaleString('vi-VN')} VNĐ
        </Text>
      )}
      {discountValue === 0 && (
        <Text style={styles.total}>
          Tổng cộng: {totalWithDiscount.toLocaleString('vi-VN')} VNĐ
        </Text>
      )}
      
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
      <View style={styles.buttonContainer}>
        {isEmployee ? (
          <TouchableOpacity
            style={[styles.button, styles.orderButton]}
            onPress={() => {
              if (!checkCartEmpty()) {
                createOrder();
              }
            }}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>Thanh toán</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.orderButton]}
            onPress={() => {
              if (!checkCartEmpty()) {
                navigation.navigate('Map', {
                  cartItems: cart,
                  totalAmount: totalWithDiscount,
                  userInfo: userLogin,
                  discountValue: discountValue
                });
              }
            }}
          >
            <Text style={[styles.buttonText, { color: 'white' }]}>Đặt Hàng</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClearCart}
        >
          <Text style={styles.buttonText}>Xóa giỏ hàng</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 15,
  },
  item: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  textContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  optionsContainer: {
    marginTop: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: '#ff6b6b',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#fee',
  },
  removeButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  total: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    textAlign: 'center',
    marginVertical: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promotionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  promotionInput: {
    flex: 1,
    height: 45,
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 15,
  },
  applyButton: {
    backgroundColor: '#00b894',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10, // Khoảng cách giữa 2 nút
    marginTop: 10,
  },
  button: {
    flex: 1, // Để 2 nút có độ rộng bằng nhau
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
  },
  orderButton: {
    backgroundColor: '#00b894',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  discountedPrice: {
    textDecorationLine: 'line-through',
    color: '#888'
  }
});

export default Cart;
