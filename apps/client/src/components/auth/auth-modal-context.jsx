import { createContext, useContext, useState } from "react"

const AuthModalContext = createContext({
    isOpen: false,
    view: "login", // "login" | "signup"
    openLogin: () => { },
    openSignup: () => { },
    close: () => { },
})

export function AuthModalProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState("login")

    const openLogin = () => {
        setView("login")
        setIsOpen(true)
    }

    const openSignup = () => {
        setView("signup")
        setIsOpen(true)
    }

    const close = () => {
        setIsOpen(false)
    }

    return (
        <AuthModalContext.Provider value={{ isOpen, view, openLogin, openSignup, close }}>
            {children}
        </AuthModalContext.Provider>
    )
}

export const useAuthModal = () => {
    const context = useContext(AuthModalContext)
    if (context === undefined) {
        throw new Error("useAuthModal must be used within an AuthModalProvider")
    }
    return context
}
