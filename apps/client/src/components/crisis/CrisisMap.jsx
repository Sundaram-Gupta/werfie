import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Vite/React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

const getSeverityColor = (severity) => {
    if (severity >= 5) return "#ef4444"; // Red
    if (severity >= 3) return "#f97316"; // Orange
    return "#3b82f6"; // Blue
};

const createCustomIcon = (severity) => {
    const color = getSeverityColor(severity);
    return L.divIcon({
        className: 'custom-crisis-marker',
        html: `<div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
        ">${severity}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
};

function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}

const CrisisMap = ({ crises = [], selectedCrisis, onSelectCrisis }) => {
    const defaultCenter = [20, 0]; // Global view
    const center = selectedCrisis ? [selectedCrisis.latitude, selectedCrisis.longitude] : defaultCenter;
    const zoom = selectedCrisis ? 6 : 2;

    return (
        <div className="h-full w-full rounded-xl overflow-hidden border border-white/10 relative">
            <MapContainer 
                center={defaultCenter} 
                zoom={2} 
                style={{ height: '100%', width: '100%', background: '#1a1a1a' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                
                <ChangeView center={center} zoom={zoom} />

                {crises.map((crisis) => (
                    <React.Fragment key={crisis.id}>
                        <Marker 
                            position={[crisis.latitude, crisis.longitude]} 
                            icon={createCustomIcon(crisis.severity)}
                            eventHandlers={{
                                click: () => onSelectCrisis(crisis),
                            }}
                        >
                            <Popup className="crisis-popup">
                                <div className="p-2 bg-slate-900 text-white rounded">
                                    <h3 className="font-bold border-b border-white/10 pb-1 mb-1">{crisis.title}</h3>
                                    <p className="text-xs text-slate-400 mb-2">{crisis.region}, {crisis.country}</p>
                                    <div className="flex justify-between items-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold 
                                            ${crisis.severity >= 4 ? 'bg-red-500' : crisis.severity >= 3 ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                            Severity {crisis.severity}
                                        </span>
                                        <span className="text-[10px] text-slate-500 uppercase">{crisis.status}</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                        
                        {/* Visual pulse for high severity */}
                        {crisis.severity >= 4 && crisis.status === 'active' && (
                            <Circle 
                                center={[crisis.latitude, crisis.longitude]}
                                radius={500000 / crisis.severity}
                                pathOptions={{ 
                                    color: getSeverityColor(crisis.severity), 
                                    fillColor: getSeverityColor(crisis.severity),
                                    fillOpacity: 0.1,
                                    weight: 1
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </MapContainer>

            {/* Map Controls & Legend overlay */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur border border-white/10 p-3 rounded-lg pointer-events-auto">
                <h4 className="text-[10px] text-slate-400 uppercase font-bold mb-2">Severity Legend</h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_5px_red]" />
                        <span>Critical (Ref 4-5)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span>Elevated (Ref 3)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Monitoring (Ref 1-2)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrisisMap;
