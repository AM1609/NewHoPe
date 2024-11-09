import { createContext, useContext, useMemo, useReducer } from "react";
import { Alert } from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
// AppRegistry
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
AppRegistry.registerComponent(appName, () => App);

// Display
const MyContext = createContext()
MyContext.displayName = "NgaoCho";

// Reducer
const reducer = (state, action) => {
    switch (action.type) {
        case "USER_LOGIN":
            return { ...state, userLogin: action.value };
        case "LOGOUT":
            return { ...state, userLogin: null };
        default:
            throw new Error("Action không tồn tại");
    }
};

// MyContext
const MyContextControllerProvider = ({ children }) => {
    const initialState = {
        userLogin: null,
        services: [],
    };
    const [controller, dispatch] = useReducer(reducer, initialState);
    const value = useMemo(() => [controller, dispatch], [controller]);
    return (
        <MyContext.Provider value={value}>
            {children}
        </MyContext.Provider>
    );
};
// useMyContext
function useMyContextProvider() {
    const context = useContext(MyContext);
    if (!context) {
        throw new Error("useMyContextProvider phải được sử dụng trong MyContextControllerProvider");
    };
    return context;
};

// Collections
const USERS = firestore().collection("USERS");

// Action
const createAccount = (email, password, fullName, phone, address, role) => {
    auth().createUserWithEmailAndPassword(email, password, fullName, phone, address, role)
    .then(() => {
        Alert.alert("Tạo tài khoản thành công với email là: " + email);
        USERS.doc(email)
        .set({
            email,
            password,
            fullName,
            phone,
            address,
            role: "customer"
        })
        .catch(error => {
            throw new Error("Lỗi thêm dữ liệu tài khoản: ", error);
        });
    })
    .catch(error => {
        throw new Error("Lỗi tạo tài khoản: ", error);
    });
};

const createnewservice = (email, password, fullName, phone, address, role) => {
    auth().createUserWithEmailAndPassword(email, password, fullName, phone, address, role)
    .then(() => {
        Alert.alert("Tạo tài khoản thành công với email là: " + email);
        USERS.doc(email)
        .set({
            email,
            password,
            fullName,
            phone,
            address,
            role: "customer"
        })
        .catch(error => {
            throw new Error("Lỗi thêm dữ liệu tài khoản: ", error);
        });
    })
    .catch(error => {
        throw new Error("Lỗi tạo tài khoản: ", error);
    });
};

const login = (dispatch, email, password) => {
    auth().signInWithEmailAndPassword(email, password)
    .then(response => {
        const unsubscribe = USERS.doc(email).onSnapshot(u => 
            {
                dispatch({ type: "USER_LOGIN", value: u.data()});
                // Alert.alert("Đăng nhập thành công với email là: " + u.id);
                unsubscribe();
            })
        }
    )
    .catch(e => Alert.alert("Email hoặc mật khẩu không chính xác"));
};

const handleLogout = async (dispatch) => {
    try {
        // Xóa thông tin đăng nhập từ AsyncStorage
        await AsyncStorage.removeItem('userEmail');
        await AsyncStorage.removeItem('userPassword');
        
        // Dispatch action để clear user state
        dispatch({
            type: 'LOGOUT'
        });
        
        // Thử đăng xuất khỏi Firebase Auth nếu có
        try {
            await auth().signOut();
        } catch (authError) {
            console.log('Firebase Auth signOut error (non-critical):', authError);
        }
        
        console.log('Logout successful');
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
};

export {
    MyContextControllerProvider,
    useMyContextProvider,
    createAccount,
    login,
    handleLogout,
    createnewservice,
};