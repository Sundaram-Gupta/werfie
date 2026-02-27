import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001';

export default function WorldLeadersAdminPage() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  
  // Form State
  const [formData, setFormData] = useState({
    institutionId: '',
    leaderName: '',
    title: '',
    country: '',
    region: '',
    priorityRank: 5,
    autoPushEnabled: false,
    verifiedStatus: true,
    profileImage: ''
  });

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${USER_SERVICE_URL}/api/users/leaders`);
      if (res.data && Array.isArray(res.data.leaders)) {
        setLeaders(res.data.leaders);
      } else if (Array.isArray(res.data)) {
        setLeaders(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddLeader = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${USER_SERVICE_URL}/api/users/leaders/create`, {
        ...formData,
        priorityRank: parseInt(formData.priorityRank, 10)
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setShowAddForm(false);
      fetchLeaders(); // Refresh list
      // Reset form
      setFormData({
        institutionId: '', leaderName: '', title: '', country: '', region: '',
        priorityRank: 5, autoPushEnabled: false, verifiedStatus: true, profileImage: ''
      });
    } catch (error) {
      console.error('Failed to add leader:', error);
      alert('Failed to add leader: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this World Leader?')) {
      try {
        await axios.delete(`${USER_SERVICE_URL}/api/users/leaders/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchLeaders();
      } catch (error) {
        console.error('Failed to delete leader:', error);
        alert('Failed to delete leader.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">World Leaders Hub</h1>
        <p className="text-muted-foreground">Manage verified Heads of State, Ministers, and global decision-makers.</p>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Input 
            type="text" 
            placeholder="Search leaders..." 
            className="pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-2" /> Add Leader</>}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Provision New World Leader</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddLeader} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Institution ID (UUID)</label>
                  <Input name="institutionId" value={formData.institutionId} onChange={handleInputChange} required placeholder="Paste Institution UUID" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Leader Name</label>
                  <Input name="leaderName" value={formData.leaderName} onChange={handleInputChange} required placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Official Title</label>
                  <Input name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. President" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country</label>
                  <Input name="country" value={formData.country} onChange={handleInputChange} required placeholder="e.g. United States" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Region</label>
                  <select name="region" value={formData.region} onChange={handleInputChange} className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required>
                    <option value="">Select Region</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia">Asia</option>
                    <option value="Middle East">Middle East</option>
                    <option value="Africa">Africa</option>
                    <option value="South America">South America</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority Rank (1-10)</label>
                  <Input name="priorityRank" type="number" min="1" max="10" value={formData.priorityRank} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Profile Image URL</label>
                  <Input name="profileImage" value={formData.profileImage} onChange={handleInputChange} placeholder="https://..." />
                </div>
                
              </div>

              <div className="flex gap-6 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="autoPushEnabled" checked={formData.autoPushEnabled} onChange={handleInputChange} />
                  <span className="text-sm">Enable Global Auto-Push Notifications</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="verifiedStatus" checked={formData.verifiedStatus} onChange={handleInputChange} />
                  <span className="text-sm">Verified Badge active</span>
                </label>
              </div>

              <Button type="submit" className="w-full mt-6">Provision Leader Profile</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leaders Table */}
      <Card>
        <div className="border rounded-md">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Leader</th>
                <th className="px-4 py-3 font-medium">Title/Country</th>
                <th className="px-4 py-3 font-medium">Priority Rank</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">Loading...</td>
                </tr>
              ) : leaders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-muted-foreground">No World Leaders configured yet.</td>
                </tr>
              ) : (
                leaders.map((leader) => (
                  <tr key={leader.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {leader.profileImage ? (
                            <img src={leader.profileImage} alt={leader.leaderName} className="object-cover w-full h-full" />
                          ) : (
                            <span className="font-semibold text-primary">{leader.leaderName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="font-medium">{leader.leaderName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div>{leader.title}</div>
                      <div className="text-xs">{leader.country}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-blue-500/10 text-blue-500 text-xs font-medium">
                        Level {leader.priorityRank}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {leader.verifiedStatus && <CheckCircle className="w-4 h-4 text-green-500" title="Verified" />}
                        {leader.autoPushEnabled && <span className="bg-red-500/10 text-red-500 text-[10px] px-1.5 py-0.5 rounded font-bold">AUTO-PUSH</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(leader.id)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
