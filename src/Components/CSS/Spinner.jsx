import './Spinner.css';

export default function Spinner({ small, medium }) {
    if (small) {
        return (
            <div className="spinner-small">
                <div className="small-spinner-wheel"></div>
            </div>
        );
    }
    if (medium) {
        return (
            <div className="spinner">
                <div className="medium-spinner-wheel"></div>
            </div>
        );
    }
    else return (
        <div className="spinner">
            <div className="spinner-wheel"></div>
        </div>
    );
}