import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/jwt"
import { hash, compare } from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request) {
    try {
        const authHeader = request.headers.get("Authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const token = authHeader.split(" ")[1]
        const payload = await verifyToken(token)
        if (!payload) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 })
        }

        const { currentPassword, newPassword } = await request.json()

        const user = await prisma.user.findUnique({ where: { id: payload.sub } })
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Verify current password
        const isValid = await compare(currentPassword, user.password)
        if (!isValid) {
            return NextResponse.json({ error: "Incorrect current password" }, { status: 400 })
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 10)

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        })

        return NextResponse.json({ message: "Password updated successfully" })
    } catch (error) {
        console.error("Change password error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
