


interface ProductFilterProps {
    onClick: () => void
}

export default function ProductFilter({ onClick }: ProductFilterProps) {
    return (
        <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={onClick}
            title="Filtrlə"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '36px' }}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'gray' }}
            >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            {/* <span style={{ display: 'none' }}>Filtr</span>  */}
        </button>
    )
}
