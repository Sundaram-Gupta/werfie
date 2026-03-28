import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getAlertRules, createAlertRule } from '../../services/enterprise.api';
import { Bell, ShieldAlert, Zap, Globe, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AlertRuleBuilder() {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        categories: '',
        regions: '',
        severityThreshold: 3,
        impactThreshold: 75,
        keywords: '',
        deliveryMethod: 'web'
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const data = await getAlertRules();
            setRules(data);
        } catch (error) {
            console.error("Failed to load rules", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSliderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseInt(value, 10)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Process comma-separated strings to arrays
            const payload = {
                ...formData,
                categories: formData.categories ? formData.categories.split(',').map(s => s.trim()) : [],
                regions: formData.regions ? formData.regions.split(',').map(s => s.trim()) : [],
                keywords: formData.keywords ? formData.keywords.split(',').map(s => s.trim()) : []
            };

            await createAlertRule(payload);
            toast.success("Alert Rule Created Successfully!");
            fetchRules();
            
            // Reset form
            setFormData({
                categories: '', regions: '', severityThreshold: 3, impactThreshold: 75, keywords: '', deliveryMethod: 'web'
            });
        } catch (error) {
            toast.error("Failed to create alert rule");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this alert rule?")) return;
        try {
            const { deleteAlertRule } = await import('../../services/enterprise.api');
            await deleteAlertRule(id);
            toast.success("Alert Rule Removed");
            fetchRules();
        } catch (error) {
            toast.error("Failed to remove rule");
            console.error(error);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rule Builder Form */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" />
                        Create Alert Rule
                    </CardTitle>
                    <CardDescription>Setup automated triggers for market signals.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Categories (comma-separated)</Label>
                            <Input 
                                name="categories" 
                                placeholder="Markets, Economy, Policy" 
                                value={formData.categories} 
                                onChange={handleInputChange} 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Regions (comma-separated)</Label>
                            <Input 
                                name="regions" 
                                placeholder="North America, Europe" 
                                value={formData.regions} 
                                onChange={handleInputChange} 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Keywords (comma-separated)</Label>
                            <Input 
                                name="keywords" 
                                placeholder="inflation, rates, subsidy" 
                                value={formData.keywords} 
                                onChange={handleInputChange} 
                            />
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Minimum Severity (1-5)</Label>
                                    <span className="text-sm font-bold text-red-500">{formData.severityThreshold}</span>
                                </div>
                                <input 
                                    type="range" 
                                    name="severityThreshold" 
                                    min="1" max="5" 
                                    value={formData.severityThreshold} 
                                    onChange={handleSliderChange} 
                                    className="w-full accent-primary" 
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Impact Threshold (0-100)</Label>
                                    <span className="text-sm font-bold text-amber-500">{formData.impactThreshold}</span>
                                </div>
                                <input 
                                    type="range" 
                                    name="impactThreshold" 
                                    min="0" max="100" 
                                    value={formData.impactThreshold} 
                                    onChange={handleSliderChange} 
                                    className="w-full accent-amber-500" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label>Delivery Method</Label>
                            <select 
                                name="deliveryMethod" 
                                value={formData.deliveryMethod} 
                                onChange={handleInputChange}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                                <option value="web">In-App Dashboard Only</option>
                                <option value="email">Email Real-time</option>
                            </select>
                        </div>

                        <Button type="submit" className="w-full mt-4" disabled={loading}>
                            {loading ? "Saving..." : <><Save className="w-4 h-4 mr-2"/> Save Rule</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Existing Rules List */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-500" />
                        Active Watch Rules
                    </CardTitle>
                    <CardDescription>Your configured signal listeners.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {rules.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                                No active alert rules configured.
                            </div>
                        ) : (
                            rules.map(rule => (
                                <div key={rule.id} className="p-4 border border-border/50 rounded-lg flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center bg-muted/20 hover:bg-muted/40 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 text-primary" />
                                            <span className="font-medium text-sm">
                                                Trigger when Impact &ge; <span className="text-amber-500 font-bold">{rule.impactThreshold}</span>
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                                                {rule.deliveryMethod}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex gap-4 capitalize">
                                            <span>Severity: {rule.severityThreshold}+</span>
                                            {rule.categories && rule.categories.length > 0 && <span>Cats: {rule.categories.join(', ')}</span>}
                                            {rule.regions && rule.regions.length > 0 && <span>Regions: {rule.regions.join(', ')}</span>}
                                        </div>
                                    </div>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-destructive hover:bg-destructive/10 border-destructive/20"
                                        onClick={() => handleDelete(rule.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
