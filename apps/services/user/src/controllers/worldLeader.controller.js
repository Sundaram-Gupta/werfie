const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createLeader = async (req, res) => {
    try {
        const {
            institutionId,
            leaderName,
            title,
            profileImage,
            region,
            country,
            priorityRank,
            autoPushEnabled,
            verifiedStatus
        } = req.body;

        // Check if institution exists
        const institution = await prisma.institutionalProfile.findUnique({
            where: { id: institutionId }
        });

        if (!institution) {
            return res.status(404).json({ status: false, message: 'Institution not found.', data: null });
        }

        const newLeader = await prisma.worldLeader.create({
            data: {
                institutionId,
                leaderName,
                title,
                profileImage,
                region,
                country,
                priorityRank: priorityRank || 0,
                autoPushEnabled: autoPushEnabled !== undefined ? autoPushEnabled : false,
                verifiedStatus: verifiedStatus !== undefined ? verifiedStatus : false
            }
        });

        return res.status(201).json({ status: true, message: 'World leader created successfully', data: newLeader });
    } catch (error) {
        console.error('Error creating world leader:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to create world leader', data: null });
    }
};

exports.updateLeader = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const leader = await prisma.worldLeader.update({
            where: { id },
            data: updateData
        });

        res.status(200).json({ status: true, message: 'World leader updated successfully', data: leader });
    } catch (error) {
        console.error('Error updating world leader:', error);
        res.status(500).json({ status: false, message: error.message || 'Failed to update world leader', data: null });
    }
};

exports.getLeader = async (req, res) => {
    try {
        const { id } = req.params;
        const leader = await prisma.worldLeader.findUnique({
            where: { id },
            include: {
                institution: true
            }
        });

        if (!leader) {
            return res.status(404).json({ status: false, message: 'World leader not found.', data: null });
        }

        res.status(200).json({ status: true, message: 'Leader fetched successfully', data: leader });
    } catch (error) {
        console.error('Error fetching world leader:', error);
        const message = error.message || 'Failed to fetch world leader';
        res.status(500).json({ status: false, message, data: null });
    }
};

exports.listLeaders = async (req, res) => {
    try {
        const { region, country, verifiedStatus } = req.query;
        let filter = {};
        if (region) filter.region = region;
        if (country) filter.country = country;
        if (verifiedStatus !== undefined) filter.verifiedStatus = verifiedStatus === 'true';

        const leaders = await prisma.worldLeader.findMany({
            where: filter,
            orderBy: { priorityRank: 'desc' },
            include: {
                institution: true
            }
        });

        res.status(200).json({ status: true, message: 'Leaders fetched successfully', data: leaders });
    } catch (error) {
        console.error('Error listing world leaders:', error);
        const message = error.message || 'Failed to list world leaders';
        res.status(500).json({ status: false, message, data: null });
    }
};

exports.deleteLeader = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.worldLeader.delete({
            where: { id }
        });

        res.status(200).json({ message: 'World leader deleted successfully' });
    } catch (error) {
        console.error('Error deleting world leader:', error);
        res.status(500).json({ error: 'Failed to delete world leader' });
    }
};
