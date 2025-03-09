import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPage = () => {
    const [candidates, setCandidates] = useState([]);
    const [message, setMessage] = useState('');
    const [candidateName, setCandidateName] = useState('');

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const response = await axios.get('http://localhost:5000/candidates');
            setCandidates(response.data);
        } catch (error) {
            console.error('Error fetching candidates:', error);
        }
    };

    const addCandidate = async () => {
        try {
            const response = await axios.post('http://localhost:5000/admin/addCandidate', { candidateName });
            setMessage(response.data.message);
            fetchCandidates();
        } catch (error) {
            console.error('Error adding candidate:', error);
        }
    };

    return (
        <div>
            <h1>Admin Page</h1>
            <h2>Candidate List</h2>
            <ul>
                {candidates.map((candidate, index) => (
                    <li key={index}>{candidate}</li>
                ))}
            </ul>

            <h2>Add Candidate</h2>
            <input 
                type="text" 
                value={candidateName} 
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter candidate name"
            />
            <button onClick={addCandidate}>Add</button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default AdminPage;
