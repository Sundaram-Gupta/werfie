// Profile select - excludes columns that may not exist in DB (e.g. gender schema drift)
module.exports.PROFILE_SELECT = {
    id: true,
    userId: true,
    name: true,
    handle: true,
    bio: true,
    avatar: true,
    banner: true,
    location: true,
    website: true,
    birthdate: true,
    createdAt: true,
    updatedAt: true,
    verified: true
};
