import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const DEFAULT_USERS = [
  {
    id: 1,
    srn_or_emp_id: 'PES2UG24CS365',
    name: 'Pranav Swaroop S',
    email: 'pranav.swaroop@pes.edu',
    role_name: 'Admin',
    role_id: 1,
    department: 'Computer Science & Engineering',
    phone: '+91-9845012365',
    clearance_level: 'Level 4 (System Administrator)',
    responsibilities: [
      'Full administrative control over database schema & tables',
      'System Audit Log verification & compliance CSV exports',
      'Safety cabinet topology & room assignment configuration',
      'Override chemical co-location hazard constraints',
      'Manage user accounts, RBAC roles, and laboratory access'
    ]
  },
  {
    id: 2,
    srn_or_emp_id: 'PES2UG24CS363',
    name: 'Pranav Kaushal J',
    email: 'pranav.kaushal@pes.edu',
    role_name: 'Lab Manager',
    role_id: 2,
    department: 'Computer Science & Engineering',
    phone: '+91-9845012363',
    clearance_level: 'Level 3 (Lab Operations & Metrology)',
    responsibilities: [
      'Equipment calibration verification & ISO/IEC 17025 certification',
      'Volumetric reagent dispensation authorization & witness sign-off',
      'Chemical stock batch intake, lot tracking, and expiry quarantine',
      'Hazardous waste disposal manifesting & KSPCB compliance',
      'Physical cabinet shelf inspection & routine maintenance scheduling'
    ]
  },
  {
    id: 3,
    srn_or_emp_id: 'PES-FAC-102',
    name: 'Dr. Rajeshwari K',
    email: 'rajeshwari.k@pes.edu',
    role_name: 'Admin',
    role_id: 1,
    department: 'Chemistry & Material Sciences',
    phone: '+91-9845011223',
    clearance_level: 'Level 4 (Faculty In-Charge & Admin)',
    responsibilities: [
      'Faculty supervisory oversight & toxic chemical approvals',
      'Curriculum laboratory protocol verification'
    ]
  },
  {
    id: 4,
    srn_or_emp_id: 'PES2UG24CS042',
    name: 'Ananya Rao',
    email: 'ananya.rao@pes.edu',
    role_name: 'Researcher',
    role_id: 3,
    department: 'Biotechnology & Life Sciences',
    phone: '+91-9845088990',
    clearance_level: 'Level 2 (Postgraduate Researcher)',
    responsibilities: [
      'Borrow analytical instruments for research protocols',
      'Dispense reagents with faculty / manager witness',
      'Log experiment notes and runtime hours'
    ]
  },
  {
    id: 5,
    srn_or_emp_id: 'PES2UG24CS999',
    name: 'Rohan Verma',
    email: 'rohan.verma@pes.edu',
    role_name: 'Student',
    role_id: 4,
    department: 'Computer Science & Engineering',
    phone: '+91-9845099881',
    clearance_level: 'Level 1 (Undergraduate Student)',
    responsibilities: [
      'Read-only access to chemical catalog & Safety Data Sheets (SDS)',
      'Check asset availability and submit borrow requests'
    ]
  }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('lab_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = DEFAULT_USERS.find(u => u.id === parsed.id);
        return match ? { ...match, ...parsed } : parsed;
      }
    } catch (e) {
      console.warn('Failed parsing saved user', e);
    }
    return DEFAULT_USERS[0]; // Pranav Swaroop S (Admin)
  });

  const [availableUsers, setAvailableUsers] = useState(DEFAULT_USERS);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    api.getUsers()
      .then(users => {
        if (Array.isArray(users) && users.length > 0) {
          // Merge with detailed responsibilities
          const merged = users.map(u => {
            const def = DEFAULT_USERS.find(d => d.id === u.id || d.srn_or_emp_id === u.srn_or_emp_id);
            return def ? { ...def, ...u } : u;
          });
          setAvailableUsers(merged);
        }
      })
      .catch(err => {
        console.log('Notice loading users from API, using default roster:', err.message);
      });
  }, []);

  const switchUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('lab_user', JSON.stringify(user));
    
    // Display brief feedback notification
    setNotification(`Switched active profile to ${user.name} (${user.role_name})`);
    setTimeout(() => setNotification(null), 3500);
  };

  const switchToSwaroop = () => {
    const swaroop = availableUsers.find(u => u.id === 1) || DEFAULT_USERS[0];
    switchUser(swaroop);
  };

  const switchToKaushal = () => {
    const kaushal = availableUsers.find(u => u.id === 2) || DEFAULT_USERS[1];
    switchUser(kaushal);
  };

  const login = async (identifier, password) => {
    const res = await api.login({ identifier, password });
    if (res.user) {
      setCurrentUser(res.user);
      localStorage.setItem('lab_user', JSON.stringify(res.user));
    }
    return res;
  };

  // RBAC Permission Helpers
  const isAdmin = currentUser.role_name === 'Admin' || currentUser.role_id === 1;
  const isLabManager = currentUser.role_name === 'Lab Manager' || currentUser.role_id === 2;
  const isStaff = isAdmin || isLabManager;
  const isResearcher = currentUser.role_name === 'Researcher' || currentUser.role_id === 3;
  const isStudent = currentUser.role_name === 'Student' || currentUser.role_id === 4;

  const canCalibrate = isAdmin || isLabManager;
  const canManageStorage = isAdmin;
  const canExportAudit = isAdmin;
  const canDispense = isAdmin || isLabManager || isResearcher;
  const canManageBatches = isAdmin || isLabManager;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        availableUsers,
        switchUser,
        switchToSwaroop,
        switchToKaushal,
        login,
        notification,
        setNotification,
        isAdmin,
        isLabManager,
        isStaff,
        isResearcher,
        isStudent,
        canCalibrate,
        canManageStorage,
        canExportAudit,
        canDispense,
        canManageBatches
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
