import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const addToCart = (product, quantity, options) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id && JSON.stringify(item.options) === JSON.stringify(options));
      if (existingItem) {
        return currentCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity, options: options } : item // Cập nhật options
        );
      }
      return [...currentCart, { ...product, quantity: quantity, options: options }]; // Thêm options vào sản phẩm mới
    });
  };

  const removeFromCart = (productId, options) => {
    setCart(currentCart => 
      currentCart.filter(item => 
        item.id !== productId || JSON.stringify(item.options) !== JSON.stringify(options)
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateQuantity = (productId, quantity, options) => {
    setCart(currentCart => 
      currentCart.map(item => 
        item.id === productId && JSON.stringify(item.options) === JSON.stringify(options) 
          ? { ...item, quantity } 
          : item
      )
    );
  };
  
  const addQuantity = (productId, quantity) => {
    setCart(currentCart => 
      currentCart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, updateQuantity, addQuantity }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);