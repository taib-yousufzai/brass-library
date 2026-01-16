import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, HardDrive, Eye, Download } from 'lucide-react';
import './Admin.css';

const Analytics = () => {
    // Mock Data
    const categoryViews = [
        { name: 'Kitchen', views: 4500 },
        { name: 'Living', views: 3200 },
        { name: 'Bedroom', views: 2800 },
        { name: 'Bathroom', views: 2100 },
        { name: 'Dining', views: 1800 },
        { name: 'Wardrobe', views: 1500 },
    ];

    const storageData = [
        { name: 'Images', value: 65, color: '#D4AF37' },
        { name: 'Videos', value: 25, color: '#C0C0C0' },
        { name: 'Free Space', value: 10, color: '#333333' },
    ];

    const stats = [
        { label: 'Total Views', value: '15.2K', icon: <Eye size={20} />, change: '+12%' },
        { label: 'Active Users', value: '124', icon: <Users size={20} />, change: '+5%' },
        { label: 'Downloads', value: '450', icon: <Download size={20} />, change: '+18%' },
        { label: 'Storage Used', value: '8.5GB', icon: <HardDrive size={20} />, change: '65%' },
    ];

    return (
        <div className="admin-page">
            <div className="page-header">
                <h1>Analytics Dashboard</h1>
                <p className="text-muted">Overview of library usage and performance</p>
            </div>

            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon">{stat.icon}</div>
                        <div className="stat-info">
                            <h3>{stat.value}</h3>
                            <p>{stat.label}</p>
                        </div>
                        <span className="stat-change">{stat.change}</span>
                    </div>
                ))}
            </div>

            <div className="charts-container">
                <div className="chart-card">
                    <h3>Most Viewed Categories</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryViews}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="views" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Storage Distribution</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={storageData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {storageData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="chart-legend">
                            {storageData.map((entry, index) => (
                                <div key={index} className="legend-item">
                                    <span className="legend-dot" style={{ backgroundColor: entry.color }}></span>
                                    <span>{entry.name} ({entry.value}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
