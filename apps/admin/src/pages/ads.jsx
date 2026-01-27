import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, PauseCircle, BarChart2 } from 'lucide-react';

const initialCampaigns = [
    { id: 1, name: 'Summer Sale 2025', client: 'Nike', status: 'active', budget: '$50,000', impressions: '1.2M', clicks: '45k' },
    { id: 2, name: 'Product Launch', client: 'Apple', status: 'paused', budget: '$100,000', impressions: '500k', clicks: '12k' },
    { id: 3, name: 'Brand Awareness', client: 'Coca Cola', status: 'completed', budget: '$75,000', impressions: '2.5M', clicks: '80k' },
];

export default function AdsPage() {
    const [campaigns, setCampaigns] = useState(initialCampaigns);

    const toggleStatus = (id) => {
        setCampaigns(campaigns.map(c => {
            if (c.id === id) {
                return { ...c, status: c.status === 'active' ? 'paused' : 'active' };
            }
            return c;
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Ads & Business</h1>
                <Button>New Campaign</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Ad Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$225,000</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaigns.filter(c => c.status === 'active').length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.2M</div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl glass-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campaign Name</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Impressions</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {campaigns.map((campaign) => (
                            <TableRow key={campaign.id}>
                                <TableCell className="font-medium">{campaign.name}</TableCell>
                                <TableCell>{campaign.client}</TableCell>
                                <TableCell>{campaign.budget}</TableCell>
                                <TableCell>{campaign.impressions}</TableCell>
                                <TableCell>{campaign.clicks}</TableCell>
                                <TableCell>
                                    <Badge variant={campaign.status === 'active' ? 'default' : campaign.status === 'paused' ? 'warning' : 'secondary'}>
                                        {campaign.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {campaign.status !== 'completed' && (
                                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(campaign.id)}>
                                            {campaign.status === 'active' ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon">
                                        <BarChart2 className="h-5 w-5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
