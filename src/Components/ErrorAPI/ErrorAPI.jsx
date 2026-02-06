// /src/Components/ErrorAPI/ErrorAPI.jsx
export default function ErrorAPI({ isOpen, onClose = () => {} }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center ">
            <div
                className="absolute inset-0 bg-black opacity-50"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-lg p-6 mx-4 text-center shadow-lg w-150">
                <h2 className="text-2xl font-bold mb-2">Destiny 2 está en mantenimiento.</h2>
                <p className="mb-4">
                    La información de está página puede estar desactualizada y/o errónea. Para saber el estado de los servidores, visita el canal de{" "}
                    <a href="discord://-/channels/318176230287605763/1224504152122724362" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">#updates</a>.
                </p>
                <div className="flex justify-center">
                    <button
                        className="bg-blue-500 text-white px-4 py-2 rounded mr-2 cursor-pointer hover:bg-blue-600"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}