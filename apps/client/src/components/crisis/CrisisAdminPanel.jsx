import React, { useState } from 'react';
import { ShieldAlert, Plus, MapPin, AlertCircle, Save, X, Radio } from 'lucide-react';
import { createCrisis, updateCrisis } from '@/services/crisis.api';
import { toast } from 'sonner';

const CrisisAdminPanel = ({ onCrisisCreated, onCrisisUpdated, editingCrisis, onCancelEdit }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(editingCrisis || {
        title: '',
        description: '',
        region: 'Global',
        country: '',
        latitude: 0,
        longitude: 0,
        severity: 3,
        status: 'active'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingCrisis) {
                const updated = await updateCrisis(editingCrisis.id, formData);
                toast.success('Crisis event updated successfully');
                onCrisisUpdated(updated);
            } else {
                const created = await createCrisis(formData);
                toast.success('Crisis event created and broadcasted');
                onCrisisCreated(created);
            }
            if (!editingCrisis) {
                setFormData({
                    title: '',
                    description: '',
                    region: 'Global',
                    country: '',
                    latitude: 0,
                    longitude: 0,
                    severity: 3,
                    status: 'active'
                });
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save crisis event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <h2 className="font-bold text-lg text-white">
                        {editingCrisis ? 'Edit Crisis Event' : 'Command New Crisis'}
                    </h2>
                </div>
                {editingCrisis && (
                    <button onClick={onCancelEdit} className="text-slate-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Crisis Title</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500/50"
                        placeholder="e.g., Regional Earthquake Response"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Description</label>
                    <textarea
                        required
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-red-500/50"
                        placeholder="Detail situation awareness..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Region</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                            value={formData.region}
                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        >
                            <option value="Global">Global</option>
                            <option value="North America">North America</option>
                            <option value="Europe">Europe</option>
                            <option value="Asia">Asia</option>
                            <option value="Africa">Africa</option>
                            <option value="South America">South America</option>
                            <option value="Middle East">Middle East</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Country</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                            placeholder="e.g., Japan"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Latitude</label>
                        <input
                            type="number"
                            step="0.000001"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                            value={formData.latitude}
                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Longitude</label>
                        <input
                            type="number"
                            step="0.000001"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none"
                            value={formData.longitude}
                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Severity (1-5)</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setFormData({ ...formData, severity: num })}
                                className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all
                                    ${formData.severity === num 
                                        ? num >= 4 ? 'bg-red-500 border-red-400 text-white' : 'bg-blue-500 border-blue-400 text-white'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all
                            ${loading ? 'bg-slate-700 cursor-not-allowed' : 
                                editingCrisis ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                    >
                        {loading ? 'Processing...' : (
                            editingCrisis ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />
                        )}
                        {editingCrisis ? 'Save Changes' : 'Launch Crisis Command'}
                    </button>
                    {formData.severity >= 4 && !editingCrisis && (
                        <p className="text-[10px] text-red-500 mt-2 text-center animate-pulse">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Launch will trigger Global Emergency Banner
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default CrisisAdminPanel;
