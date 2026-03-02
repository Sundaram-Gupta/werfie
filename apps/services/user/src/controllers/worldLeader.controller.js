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
            return res.status(404).json({ error: 'Institution not found.' });
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

        return res.status(201).json({
            message: 'World leader created successfully',
            leader: newLeader
        });
    } catch (error) {
        console.error('Error creating world leader:', error);
        res.status(500).json({ error: 'Failed to create world leader' });
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

        res.status(200).json({
            message: 'World leader updated successfully',
            leader
        });
    } catch (error) {
        console.error('Error updating world leader:', error);
        res.status(500).json({ error: 'Failed to update world leader' });
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
            return res.status(404).json({ error: 'World leader not found.' });
        }

        res.status(200).json(leader);
    } catch (error) {
        console.error('Error fetching world leader:', error);
        res.status(500).json({ error: 'Failed to fetch world leader' });
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

        res.status(200).json(leaders);
    } catch (error) {
        console.error('Error listing world leaders:', error);
        res.status(500).json({ error: 'Failed to list world leaders' });
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
