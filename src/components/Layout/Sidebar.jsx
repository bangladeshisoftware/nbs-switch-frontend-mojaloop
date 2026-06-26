/**************************************************************************
 * Copyright © 2026 Bangladeshi Software Ltd. All rights reserved.
 * Distributed under the license terms specified in this repository.
 *
 * ORIGINAL AUTHOR: Muhammad Nasim (Developer)
 **************************************************************************/

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './sidebar.css';
import { FaMoneyCheck } from 'react-icons/fa';
import { MdHub, MdWidthNormal } from 'react-icons/md';
import { GrOracle } from 'react-icons/gr';
import { HistoryIcon } from 'lucide-react';
import { GiPayMoney } from 'react-icons/gi';
import { TbBuildingBank } from 'react-icons/tb';

const NAV = [
  {
    section: 'Monitor',
    items: [
      { to: '/', label: 'Dashboard', icon: <GridIcon /> },
      { to: '/transactions', label: 'Transactions', icon: <ListIcon /> },
      { to: '/notifications', label: 'Notifications', icon: <BellIcon /> },
    ],
  },
  {
    section: 'Liquidity',
    items: [
      { to: '/liquidity', label: 'Liquidity', icon: <FaMoneyCheck /> },
      {
        to: '/positions',
        label: 'Positions History',
        icon: <ChartIcon />,
      },
    ],
  },
  {
    section: 'Finance',
    items: [
      { to: '/reconciliation', label: 'Reconciliation', icon: <BalanceIcon /> },
      { to: '/settlement', label: 'Settlement', icon: <VaultIcon /> },
      {
        to: '/settlement-finalize-records',
        label: 'Finalize Records',
        icon: <GiPayMoney />,
      },
      {
        to: '/settlement-complete-records',
        label: 'Settlement History',
        icon: <HistoryIcon />,
      },
      {
        to: '/deposits-records',
        label: 'Deposits History',
        icon: <TbBuildingBank />,
      },

      { to: '/reports', label: 'Reports', icon: <ReportIcon /> },
    ],
  },
  {
    section: 'Hub configuration',
    items: [
      { to: '/hub/accounts', label: 'Hub Accounts', icon: <MdHub /> },
      {
        to: '/hub/settlement-models',
        label: 'Settlement Models',
        icon: <MdWidthNormal />,
      },
      {
        to: '/hub/oracles',
        label: 'Oracle Config',
        icon: <GrOracle />,
      },
    ],
  },
  {
    section: 'Admin',
    items: [
      { to: '/dfsps', label: 'DFSP Management', icon: <BuildingIcon /> },
      { to: '/activity-logs', label: 'Activity Logs', icon: <ActivityIcon /> },
      { to: '/users', label: 'Users', icon: <UsersIcon /> },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className='sidebar'>
      <div className='sidebar-logo'>
        <div className='logo-mark'>
          {/* <div className='logo-icon'>NB</div>
          <div>
            <div className='logo-text'>NB Switch</div>
            <div className='logo-sub'>Hub Portal</div>
          </div> */}
          <NavLink to={'/'}>
            <img
              className='logo-animated-border'
              alt='NB Logo'
              style={{ width: '100%' }}
              src='/l1.png'
            />
          </NavLink>
        </div>
      </div>

      <nav className='sidebar-nav'>
        {NAV.map((section) => (
          <div key={section.section}>
            <div className='nav-section-label'>{section.section}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `nav-item${isActive ? ' active' : ''}`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className='sidebar-footer'>
        <div className='user-badge'>
          <div className='user-avatar'>
            {user?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className='user-info'>
            <div className='user-name'>{user?.username || 'Admin'}</div>
            <div className='user-role'>{user?.role || 'ADMIN'}</div>
          </div>
          <button className='logout-btn' onClick={handleLogout} title='Logout'>
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  );
}

function GridIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <rect x='3' y='3' width='7' height='7' />
      <rect x='14' y='3' width='7' height='7' />
      <rect x='3' y='14' width='7' height='7' />
      <rect x='14' y='14' width='7' height='7' />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <line x1='8' y1='6' x2='21' y2='6' />
      <line x1='8' y1='12' x2='21' y2='12' />
      <line x1='8' y1='18' x2='21' y2='18' />
      <line x1='3' y1='6' x2='3.01' y2='6' />
      <line x1='3' y1='12' x2='3.01' y2='12' />
      <line x1='3' y1='18' x2='3.01' y2='18' />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' />
      <path d='M13.73 21a2 2 0 0 1-3.46 0' />
    </svg>
  );
}
function ChartIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <line x1='18' y1='20' x2='18' y2='10' />
      <line x1='12' y1='20' x2='12' y2='4' />
      <line x1='6' y1='20' x2='6' y2='14' />
    </svg>
  );
}
function BalanceIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <line x1='12' y1='2' x2='12' y2='22' />
      <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
    </svg>
  );
}
function VaultIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <rect x='2' y='3' width='20' height='14' rx='2' />
      <path d='M8 21h8m-4-4v4' />
      <circle cx='12' cy='10' r='3' />
    </svg>
  );
}
function BuildingIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M3 21h18M9 8h1m-1 4h1m-1 4h1m4-8h1m-1 4h1m-1 4h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16' />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
      <circle cx='9' cy='7' r='4' />
      <path d='M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75' />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
    >
      <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
      <polyline points='16,17 21,12 16,7' />
      <line x1='21' y1='12' x2='9' y2='12' />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z' />
      <path d='M6 15h5v5h4V7h-5V5H6v10z' />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
      <polyline points='14,2 14,8 20,8' />
      <line x1='16' y1='13' x2='8' y2='13' />
      <line x1='16' y1='17' x2='8' y2='17' />
      <polyline points='10,9 9,9 8,9' />
    </svg>
  );
}

function PispIcon() {
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
      <circle cx='12' cy='12' r='10' />
      <path d='M8 12h8m-4-4v8' />
      <path d='M16 8l2-2m-10 0L6 8' />
    </svg>
  );
}
