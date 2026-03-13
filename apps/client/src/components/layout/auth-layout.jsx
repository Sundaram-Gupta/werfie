import { Outlet } from "react-router-dom"

export default function AuthLayout() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <div className="w-full max-w-md p-4">
                <Outlet />
            </div>
        </div>
    )
}
