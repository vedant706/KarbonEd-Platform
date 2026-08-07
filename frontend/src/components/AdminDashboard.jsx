import React, { useState, useEffect } from 'react';

export const AdminDashboard = ({ token }) => {
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/admin/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (response.ok) {
                setProjects(data);
            } else {
                setError(data.error || 'Failed to fetch projects.');
            }
        } catch (err) {
            setError('Failed to connect to the server.');
        }
    };

    const verifyProject = async (projectId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/projects/${projectId}/verify`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                // Instantly update the UI to show it is verified without reloading the page!
                setProjects(projects.map(p => 
                    p._id === projectId ? { ...p, isVerified: true } : p
                ));
            }
        } catch (err) {
            console.error('Failed to verify:', err);
        }
    };

    return (
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '20px' }}>
            <h2 style={{ borderBottom: '2px solid #2ecc71', paddingBottom: '10px' }}>Admin Verification Portal 🛡️</h2>
            <p>Review 3rd-party verification codes and approve projects for the marketplace.</p>
            
            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
            
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ background: '#f4f4f4', textAlign: 'left' }}>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Project Name</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Company</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Amount (Tons)</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Verification Code</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Status</th>
                            <th style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => (
                            <tr key={project._id} style={{ transition: '0.3s', backgroundColor: project.isVerified ? '#f9fff9' : '#fff9f9' }}>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{project.projectName}</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{project.companyName}</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>{project.offsetAmount}</td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}><code>{project.thirdPartyVerificationCode}</code></td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                    {project.isVerified ? 
                                        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Verified</span> : 
                                        <span style={{ color: '#f39c12', fontWeight: 'bold' }}>⏳ Pending</span>
                                    }
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                    {!project.isVerified && (
                                        <button 
                                            onClick={() => verifyProject(project._id)}
                                            style={{ padding: '8px 15px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Approve Project
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};