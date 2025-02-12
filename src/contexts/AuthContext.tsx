import React, {useState, useEffect, createContext, ReactNode} from "react";
import { api } from "../services/api"; 
import AsyncStorage from "@react-native-async-storage/async-storage";


type AuthContextData = {
 user:UserProps,
 isAuthenticated:boolean;
 signIn: (credentials: SignInProps) => Promise<void>;
 loadingAuth: boolean;
 loading: boolean;
 signOut: () => Promise<void>;
}

type UserProps ={
    id:string,
    name:string,
    email:string,
    token:string
}

type AuthProviderProps = {
    children: ReactNode
}

type SignInProps = {
    email: string;
    password: string;
}

export const AuthContext = createContext({} as AuthContextData);
export function AuthProvider({children}: AuthProviderProps){
const [user, setUser] = useState<UserProps>({
    id:'',
    name:'',
    email:'',
    token:''
})


const [loadingAuth, setLoadingAuth] = useState(false);
const [loading, setLoading] = useState(true);
const isAuthenticated = !!user.name; //Converter user.name para boleano

useEffect(() => {
    async function getUser(){
        //Pegar dados salvos do user
        const userInfo = await AsyncStorage.getItem('@sujeitopizzaria')
        let hasUser: UserProps = JSON.parse(userInfo || '{}');
        //verificar se tem informações
        if(Object.keys(hasUser).length > 0) { // se é maior do que zero, quer dizer que tem itens e o usuario fez o login
            api.defaults.headers.common['Authorization'] = `Bearer ${hasUser.token}`

            setUser({
                id:hasUser.id,
                name: hasUser.name,
                email: hasUser.email,
                token: hasUser.token
            })
        }
        setLoading(false)
    }    

    getUser();
}, [])


async function signIn({email, password}: SignInProps){
    setLoadingAuth(true);
    try {
        const response = await api.post('/session', {
            email,
            password
        })

        const {id, name, token} = response.data;
        const data = {
            ...response.data
        }

        await AsyncStorage.setItem('@sujeitopizzaria', JSON.stringify(data))
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        setUser({
            id,
            name,
            email,
            token
        })

        setLoadingAuth(false);

    } catch {
        console.log('erro ao acesar!')
        setLoadingAuth(false);
    }
}

async function signOut(){
    await AsyncStorage.clear()
    .then(() => {
        setUser({
            id: '',
            name: '',
            email: '',
            token: ''
        })
    })
}

    return(
        <AuthContext.Provider 
        value={{
            user,
            isAuthenticated,
            signIn,
            loading,
            loadingAuth,
            signOut}}
        >
            {children}
        </AuthContext.Provider>
    )
}