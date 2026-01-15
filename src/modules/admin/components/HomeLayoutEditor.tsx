
import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Import Preview Components
import { PreviewHero } from '../../store/components/home/react/PreviewHero';
import { PreviewOfferBanner } from '../../store/components/home/react/PreviewOfferBanner';
import { PreviewCategoriesGrid } from '../../store/components/home/react/PreviewCategoriesGrid';
import { PreviewFeaturedProducts } from '../../store/components/home/react/PreviewFeaturedProducts';
import { PreviewValueProps } from '../../store/components/home/react/PreviewValueProps';

const getComponentByKey = (key: string, config?: any) => {
    // Pass config to components if they support it (future improvement)
    // For now, render standard preview
    // We could make PreviewOfferBanner accept props from config to show dynamic text in preview
    switch (key) {
        case 'hero': return <PreviewHero config={config} />;
        case 'offer_banner': return <PreviewOfferBanner config={config} />;
        case 'categories': return <PreviewCategoriesGrid />;
        case 'featured': return <PreviewFeaturedProducts />;
        case 'values': return <PreviewValueProps />;
        case 'custom_text':
            return (
                <div className="py-12 px-4 text-center bg-white">
                    <h2 className="text-3xl font-bold font-display" style={{ color: config?.textColor || '#000000' }}>
                        {config?.title || 'Título Personalizado'}
                    </h2>
                    <p className="mt-4 text-lg text-slate-600">
                        {config?.subtitle || 'Añade tu subtítulo aquí desde el editor.'}
                    </p>
                </div>
            );
        default: return <div className="p-8 text-center bg-slate-800 text-white">Sección desconocida: {key}</div>;
    }
};

// Sortable Block Component
function SortableBlock(props: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: props.isVisible ? 1 : 0.4,
        filter: props.isVisible ? 'none' : 'grayscale(100%)',
    };

    return (
        <div ref={setNodeRef} style={style} className="relative mb-8 group transition-all duration-200">
            {/* Visual Block Preview */}
            <div className={`w-full bg-white shadow-2xl overflow-hidden relative border-2 ${props.isDragging ? 'border-accent scale-105 z-50' : 'border-transparent hover:border-slate-300'}`}>

                {/* Overlay to prevent interaction with inner links/buttons while dragging */}
                <div className="absolute inset-0 z-10" />

                {/* Render the actual component */}
                {getComponentByKey(props.keyName, props.config)}

                {!props.isVisible && (
                    <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-white font-bold uppercase tracking-widest border-2 border-white px-6 py-3 text-xl">
                            Sección Oculta
                        </span>
                    </div>
                )}
            </div>

            {/* Controls Overlay (Top Right) */}
            <div className="absolute top-4 right-4 flex gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Edit Button (NEW) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        props.onEdit(props.id);
                    }}
                    className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-full shadow-lg transition-colors transform hover:scale-110"
                    title="Editar Contenido"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>

                {/* Visibility Toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        props.onToggle(props.id);
                    }}
                    className="p-3 bg-white text-black hover:bg-slate-200 rounded-full shadow-lg transition-colors transform hover:scale-110"
                    title={props.isVisible ? "Ocultar sección" : "Mostrar sección"}
                >
                    {props.isVisible ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    )}
                </button>

                {/* Delete Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // Immediate delete without confirmation as requested
                        props.onDelete(props.id);
                    }}
                    className="p-3 bg-red-600 text-white hover:bg-red-700 rounded-full shadow-lg transition-colors transform hover:scale-110"
                    title="Eliminar Sección"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* Drag Handle Overlay */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-4 left-4 p-3 bg-white text-black hover:bg-slate-200 rounded-full shadow-lg cursor-grab active:cursor-grabbing z-30 opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                title="Arrastrar para reordenar"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
            </div>

            {/* Label Tag */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white text-xs font-bold uppercase px-3 py-1 rounded-full shadow-sm z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {props.label}
            </div>
        </div>
    );
}

export default function HomeLayoutEditor() {
    const [sections, setSections] = useState<any[]>([]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [activeId, setActiveId] = useState(null);
    const [showLibrary, setShowLibrary] = useState(false);

    // Config Modal State
    const [configModal, setConfigModal] = useState<{ isOpen: boolean, sectionId: string | null }>({ isOpen: false, sectionId: null });
    const [editConfig, setEditConfig] = useState<any>({});
    // We removed editLabel from UI, but we keep it in state if needed or we just use section.label
    const [editLabel, setEditLabel] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchLayout();
    }, []);

    const fetchLayout = async () => {
        try {
            const res = await fetch('/api/admin/layout/home');
            const data = await res.json();
            if (data.success) {
                setSections(data.data);
                setDeletedIds([]);
            }
        } catch (e) {
            console.error("Error fetching layout:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        setActiveId(null);
        const { active, over } = event;

        if (active.id !== over.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const toggleVisibility = (id: string) => {
        setSections(sections.map(s =>
            s.id === id ? { ...s, is_visible: !s.is_visible } : s
        ));
    };

    const handleDelete = (id: string) => {
        // If it's a new unsaved section (starts with new-), just remove from list
        if (!id.toString().startsWith('new-')) {
            setDeletedIds([...deletedIds, id]);
        }
        setSections(sections.filter(s => s.id !== id));
    };

    const handleAddSection = (type: string, label: string) => {
        const newSection = {
            id: `new-${Date.now()}`,
            key: type,
            label: label,
            is_visible: true,
            order_index: sections.length,
            component_config: {}
        };
        setSections([...sections, newSection]);
        setShowLibrary(false);
        setMessage('Sección añadida. Recuerda GUARDAR los cambios.');
    };

    // Edit Handling
    const openEditModal = (id: string) => {
        const section = sections.find(s => s.id === id);
        if (section) {
            setEditConfig(section.component_config || {});
            setConfigModal({ isOpen: true, sectionId: id });
        }
    };

    const saveConfig = () => {
        if (configModal.sectionId) {
            setSections(sections.map(s =>
                s.id === configModal.sectionId
                    ? { ...s, component_config: editConfig } // Don't update label unless we add back the field
                    : s
            ));
            setConfigModal({ isOpen: false, sectionId: null });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            const payload = sections.map((s, index) => {
                const { id, ...rest } = s;
                const finalId = id.toString().startsWith('new-') ? undefined : id;
                return {
                    ...rest,
                    id: finalId,
                    order_index: index
                };
            });

            const res = await fetch('/api/admin/layout/home', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sections: payload,
                    deletedIds: deletedIds
                }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Diseño guardado correctamente');
                fetchLayout();
            } else {
                setMessage(`Error al guardar: ${data.error}`);
            }
        } catch (e: any) {
            setMessage(`Error de conexión: ${e.message}`);
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (loading) return <div className="text-white">Cargando editor...</div>;

    const currentSectionKey = configModal.sectionId ? sections.find(s => s.id === configModal.sectionId)?.key : '';

    return (
        <div className="max-w-6xl mx-auto relative">
            {/* Header controls */}
            <div className="mb-8 flex justify-between items-center sticky top-0 py-4 bg-slate-900/95 backdrop-blur z-40 border-b border-slate-800 px-4 -mx-4 shadow-md">
                <div>
                    <h2 className="text-xl font-bold text-white">Vista Previa Real</h2>
                    <p className="text-slate-400 text-sm">
                        Arrastra para reordenar, edita o elimina secciones.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowLibrary(true)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold uppercase rounded transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Añadir
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-accent hover:bg-red-700 text-white font-bold uppercase disabled:opacity-50 transition-colors shadow-lg shadow-accent/20 rounded"
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            {/* Component Library Modal */}
            {showLibrary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Añadir Nueva Sección</h3>
                            <button
                                onClick={() => setShowLibrary(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { id: 'offer_banner', label: 'Banner de Oferta', desc: 'Franja roja con texto de oferta y botón' },
                                { id: 'categories', label: 'Grid Categorías', desc: 'Mosaico de 5 categorías principales' },
                                { id: 'featured', label: 'Productos Destacados', desc: 'Carrusel de 4 productos' },
                                { id: 'values', label: 'Propuestas de Valor', desc: 'Iconos de iconos de envío, devolución...' },
                                { id: 'hero', label: 'Hero Banner', desc: 'Banner principal de cabecera' },
                                { id: 'custom_text', label: 'Bloque Texto Personal', desc: 'Título y texto editable' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleAddSection(item.id, item.label)}
                                    className="flex flex-col items-start p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-accent rounded-lg transition-all group text-left"
                                >
                                    <span className="font-bold text-white group-hover:text-accent mb-1">{item.label}</span>
                                    <span className="text-sm text-slate-400">{item.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Configuration Modal */}
            {configModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wider">Editar Contenido</h3>
                            <button
                                onClick={() => setConfigModal({ isOpen: false, sectionId: null })}
                                className="text-slate-400 hover:text-black transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

                            {/* Hero Config */}
                            {currentSectionKey === 'hero' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Título Principal</label>
                                        <input
                                            type="text"
                                            value={editConfig.title || ''}
                                            onChange={(e) => setEditConfig({ ...editConfig, title: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-accent focus:outline-none"
                                            placeholder="Ej: NUEVA COLECCIÓN 2026"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Subtítulo</label>
                                        <input
                                            type="text"
                                            value={editConfig.subtitle || ''}
                                            onChange={(e) => setEditConfig({ ...editConfig, subtitle: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-accent focus:outline-none"
                                            placeholder="Ej: Define tu estilo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Texto Botón</label>
                                        <input
                                            type="text"
                                            value={editConfig.buttonText || ''}
                                            onChange={(e) => setEditConfig({ ...editConfig, buttonText: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-accent focus:outline-none"
                                            placeholder="Ej: Comprar Ahora"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Offer Banner Config */}
                            {currentSectionKey === 'offer_banner' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Título Oferta</label>
                                        <input
                                            type="text"
                                            value={editConfig.title || ''}
                                            onChange={(e) => setEditConfig({ ...editConfig, title: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-accent focus:outline-none"
                                            placeholder="Ej: OFERTA FLASH"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Texto Descuento</label>
                                        <input
                                            type="text"
                                            value={editConfig.subtitle || ''}
                                            onChange={(e) => setEditConfig({ ...editConfig, subtitle: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-accent focus:outline-none"
                                            placeholder="Ej: Hasta -50%..."
                                        />
                                    </div>
                                </>
                            )}

                            {/* Custom Text Config */}
                            {currentSectionKey === 'custom_text' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                                        <input
                                            type="text"
                                            value={editConfig.title || ''}
                                            onChange={(e) => setEditConfig({ ...editConfig, title: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-accent focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Contenido</label>
                                        <textarea
                                            value={editConfig.subtitle || ''}
                                            onChange={(e) => setEditConfig({ ...editConfig, subtitle: e.target.value })}
                                            className="w-full px-4 py-2 border border-slate-300 rounded focus:border-accent focus:outline-none"
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Color Título</label>
                                        <input
                                            type="color"
                                            value={editConfig.textColor || '#000000'}
                                            onChange={(e) => setEditConfig({ ...editConfig, textColor: e.target.value })}
                                            className="w-full h-10 p-1 border border-slate-300 rounded cursor-pointer"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Generic fallback */}
                            {!['hero', 'offer_banner', 'custom_text'].includes(currentSectionKey) && (
                                <p className="text-sm text-slate-500 italic">
                                    Este tipo de sección no tiene opciones de texto editables.
                                </p>
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <button
                                onClick={() => setConfigModal({ isOpen: false, sectionId: null })}
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveConfig}
                                className="px-6 py-2 bg-black text-white font-bold rounded hover:bg-slate-800"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {message && (
                <div className={`mb-6 p-4 rounded-lg font-medium border ${message.includes('Error') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                    {message}
                </div>
            )}

            <div className="space-y-8 pb-20">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sections.map(s => s.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {sections.map((section) => (
                            <SortableBlock
                                key={section.id}
                                id={section.id}
                                label={section.label}
                                keyName={section.key}
                                isVisible={section.is_visible}
                                config={section.component_config}
                                onToggle={toggleVisibility}
                                onDelete={handleDelete}
                                onEdit={openEditModal}
                                isDragging={activeId === section.id}
                            />
                        ))}
                    </SortableContext>

                    {/* Drag Overlay for smooth animation */}
                    <DragOverlay>
                        {activeId ? (
                            <div className="opacity-90 scale-105 shadow-2xl rotate-1 border-2 border-accent bg-white overflow-hidden">
                                {getComponentByKey(sections.find(s => s.id === activeId)?.key, sections.find(s => s.id === activeId)?.component_config)}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
}
