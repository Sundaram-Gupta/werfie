import { prisma } from "@/lib/prisma"
import { verifyToken } from "@/lib/jwt"
import { apiSuccess, apiError } from "@/lib/api-response"
import bcrypt from "bcrypt"

export async function POST(request) {
    try {
        const authHeader = request.headers.get("Authorization")
        if (!authHeader?.startsWith("Bearer ")) {
            return apiError("Unauthorized", 401, null)
        }

        const token = authHeader.split(" ")[1]
        const payload = await verifyToken(token)
        if (!payload) {
            return apiError("Invalid token", 401, null)
        }

        const { currentPassword, newPassword } = await request.json()

        const user = await prisma.user.findUnique({ where: { id: payload.sub } })
        if (!user) {
            return apiError("User not found", 404, null)
        }

        if (!user.passwordHash) {
            return apiError("Account has no password set", 400, null)
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
        if (!isValid) {
            return apiError("Incorrect current password", 400, null)
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        })

        return apiSuccess(null, "Password updated successfully")
    } catch (error) {
        console.error("Change password error:", error)
        const isAuthError = error?.message === "Invalid token"
        return apiError(
            isAuthError ? "Unauthorized" : "Internal server error",
            isAuthError ? 401 : 500,
            null
        )
    }
}
