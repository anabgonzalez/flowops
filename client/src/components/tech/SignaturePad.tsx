import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Box, Button, HStack, Input, Text } from '@chakra-ui/react'

interface Props {
    onCapture: (blob: Blob, signerName: string) => void
    capturing: boolean
}

/** Minimal canvas-based signature capture -- no external library, since
 * this is the only place in the app that would need one. */
export default function SignaturePad({ onCapture, capturing }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawingRef = useRef(false)
    const [hasStroke, setHasStroke] = useState(false)
    const [signerName, setSignerName] = useState('')

    function getContext(): CanvasRenderingContext2D | null {
        return canvasRef.current?.getContext('2d') ?? null
    }

    function pointerPos(e: ReactPointerEvent<HTMLCanvasElement>): { x: number; y: number } {
        const rect = canvasRef.current!.getBoundingClientRect()
        return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
        drawingRef.current = true
        const ctx = getContext()
        const { x, y } = pointerPos(e)
        ctx?.beginPath()
        ctx?.moveTo(x, y)
    }

    function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
        if (!drawingRef.current) return
        const ctx = getContext()
        if (!ctx) return
        const { x, y } = pointerPos(e)
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#1a1a1a'
        ctx.lineTo(x, y)
        ctx.stroke()
        setHasStroke(true)
    }

    function handlePointerUp() {
        drawingRef.current = false
    }

    function handleClear() {
        const canvas = canvasRef.current
        const ctx = getContext()
        if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
        setHasStroke(false)
    }

    function handleSave() {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.toBlob((blob) => {
            if (blob) onCapture(blob, signerName)
        }, 'image/png')
    }

    return (
        <Box>
            <Text fontWeight="bold" mb="2">Customer signature</Text>
            <Input
                placeholder="Customer name"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                mb="2"
                size="sm"
            />
            <Box borderWidth="1px" borderRadius="md" bg="white" touchAction="none">
                <canvas
                    ref={canvasRef}
                    width={340}
                    height={160}
                    style={{ width: '100%', height: '160px', touchAction: 'none' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />
            </Box>
            <HStack mt="2" gap="2">
                <Button size="sm" variant="surface" onClick={handleClear}>Clear</Button>
                <Button
                    size="sm"
                    colorPalette="blue"
                    disabled={!hasStroke || !signerName.trim()}
                    loading={capturing}
                    onClick={handleSave}
                >
                    Save signature
                </Button>
            </HStack>
        </Box>
    )
}
