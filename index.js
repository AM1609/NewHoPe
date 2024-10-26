import { createContext, useContext, useMemo, useReducer } from "react";
import { Alert } from "react-native";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
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


const logout = (dispatch) => {
    auth().signOut()
    .then(() => dispatch({ type: "LOGOUT" }));
};


export {
    MyContextControllerProvider,
    useMyContextProvider,
    createAccount,
    login,
    logout,
    createnewservice,
};