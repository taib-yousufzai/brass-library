// Main Layout Component
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './MainLayout.css';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleMenuClick = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="main-layout">
            <Sidebar className={sidebarOpen ? 'open' : ''} />
            <div className="main-content">
                <Header onMenuClick={handleMenuClick} />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
            {sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default MainLayout;
