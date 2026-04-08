import { useEffect, useState } from 'react'

interface Props {
    src: string
    alt?: string
    className?: string
}

export default function ImageLightbox({ src, alt = '', className }: Props) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open])

    return (
        <>
            <img
                src={src}
                alt={alt}
                className={`cursor-zoom-in ${className ?? ''}`}
                onClick={() => setOpen(true)}
            />
            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                >
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl leading-none"
                        onClick={() => setOpen(false)}
                    >
                        ✕
                    </button>
                </div>
            )}
        </>
    )
}
