import React from 'react';
import './Spinner.css';

export default function Spinner({ small }) {
    if (small) {
        return (
            <div className="spinner-small">
                <div className="small-spinner-wheel"></div>
            </div>
        );
    }
    else return (
        <div className="spinner">
            <div className="spinner-wheel"></div>
        </div>
    );
}