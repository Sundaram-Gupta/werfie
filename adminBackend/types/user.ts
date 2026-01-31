import { User as PrismaUser, Profile, BusinessProfile } from '@prisma/client';

export type User = PrismaUser & {
    profile?: Profile | null;
    businessProfile?: BusinessProfile | null;
}

export type UserResponse = {
    user: Partial<User>;
    success: boolean;
    message?: string;
    error?: string;
}

export type UsersListResponse = {
    users: Partial<User>[];
    pagination: {
        totalUsers: number;
        currentPage: number;
        totalPages: number;
        limit: number;
    };
    success: boolean;
}
