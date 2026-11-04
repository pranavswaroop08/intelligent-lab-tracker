import React from 'react';

/**
 * Standard NFPA 704 Hazard Diamond
 * Blue: Health, Red: Flammability, Yellow: Instability, White: Special
 */
export default function NFPA704Diamond({ health = 0, flammability = 0, instability = 0, special = '', size = 64 }) {
  const half = size / 2;
  const quarter = size / 4;

  return (
    <div className="relative inline-block select-none" style={{ width: size, height: size }} title={`NFPA 704: Health ${health}, Flam ${flammability}, Instability ${instability}${special ? ', Special ' + special : ''}`}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Top Diamond: Red (Flammability) */}
        <polygon points="50,0 75,25 50,50 25,25" fill="#dc2626" stroke="#0f172a" strokeWidth="2" />
        <text x="50" y="32" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle">{flammability}</text>

        {/* Left Diamond: Blue (Health) */}
        <polygon points="25,25 50,50 25,75 0,50" fill="#2563eb" stroke="#0f172a" strokeWidth="2" />
        <text x="25" y="57" fill="#ffffff" fontSize="20" fontWeight="bold" textAnchor="middle">{health}</text>

        {/* Right Diamond: Yellow (Instability) */}
        <polygon points="75,25 100,50 75,75 50,50" fill="#eab308" stroke="#0f172a" strokeWidth="2" />
        <text x="75" y="57" fill="#0f172a" fontSize="20" fontWeight="bold" textAnchor="middle">{instability}</text>

        {/* Bottom Diamond: White (Special) */}
        <polygon points="50,50 75,75 50,100 25,75" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        <text x="50" y="82" fill="#0f172a" fontSize={special.length > 2 ? '13' : '17'} fontWeight="bold" textAnchor="middle">
          {special || ''}
        </text>
      </svg>
    </div>
  );
}
