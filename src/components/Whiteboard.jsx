const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)

// Zoom (Wheel) & Pan (Wheel)
useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e) => {
        if (e.ctrlKey) {
            e.preventDefault()
            const s = Math.exp(-e.deltaY * 0.01)
            setScale(prev => Math.min(Math.max(0.1, prev * s), 5))
        } else {
            e.preventDefault()
            setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
        }
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
}, [])

// Pan (Drag)
const handlePointerDown = (e) => {
    // Only pan if clicking on background (not a node/button)
    if (e.target === containerRef.current || e.target.classList.contains('grid-bg')) {
        setIsDraggingCanvas(true)
        e.target.setPointerCapture(e.pointerId)
    }
}

const handlePointerMove = (e) => {
    if (!isDraggingCanvas) return
    setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }))
}

const handlePointerUp = (e) => {
    setIsDraggingCanvas(false)
    if (e.target) e.target.releasePointerCapture(e.pointerId)
}

// Auto Arrange
const autoArrange = () => {
    const cols = Math.ceil(Math.sqrt(nodes.length))
    const gap = 350
    nodes.forEach((node, i) => {
        const col = i % cols
        const row = Math.floor(i / cols)

        const targetX = 100 + col * gap
        const targetY = 100 + row * gap

        onUpdateNodeData(node.id, { x: targetX, y: targetY })
    })
}

return (
    <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f0f2f5', position: 'relative', touchAction: 'none', cursor: isDraggingCanvas ? 'grabbing' : 'grab' }}
    >

        {/* Background Grid */}
        <div className="grid-bg" style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(#ccc 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            opacity: 0.5,
            pointerEvents: 'none'
        }} />

        <motion.div style={{
            width: '100%', height: '100%',
            x: offset.x, y: offset.y, scale,
            transformOrigin: '0 0',
            pointerEvents: 'none' // Nodes have pointerEvents: auto
        }}>
            {nodes.map(node => (
                <DraggableNode
                    key={node.id}
                    node={node}
                    onUpdatePosition={onUpdateNodePosition}
                    onUpdateData={onUpdateNodeData}
                    onDelete={onDeleteNode}
                />
            ))}
        </motion.div>

        <motion.div
            className="glass-panel"
            style={{
                const ToolBtn = ({ icon, label, onClick }) => (
                    <motion.button
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={onClick}
                        title={label}
                        style={{
                            width: 50, height: 50, borderRadius: '50%',
                            border: 'none', background: 'white', color: 'var(--primary)',
                            fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                        }}
                    >
                        {icon}
                    </motion.button>
                )
