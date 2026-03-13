"use client";

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues with it
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
    return (
        <div className="bg-white min-h-screen">
            <SwaggerUI url="/openapi.yaml" />
        </div>
    );
}
