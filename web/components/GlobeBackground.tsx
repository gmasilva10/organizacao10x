"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false })

type Props = {
	className?: string
	sizeDesktop?: number
	sizeMobile?: number
}

// no local types needed

// removed unused GlobeInstance interface

export function GlobeBackground({ className, sizeDesktop = 640, sizeMobile = 320 }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [size, setSize] = useState({ w: sizeMobile, h: sizeMobile })

	useEffect(() => {
		const update = () => {
			const width = containerRef.current?.offsetWidth ?? sizeDesktop
			const isMobile = width < 640
			const s = isMobile ? sizeMobile : sizeDesktop
			setSize({ w: s, h: s })
		}
		update()
		window.addEventListener("resize", update)
		return () => window.removeEventListener("resize", update)
	}, [sizeDesktop, sizeMobile])



	return (
		<div ref={containerRef} className={className} style={{ pointerEvents: "none" }}>
      <Globe
				width={size.w}
				height={size.h}
			/>
		</div>
	)
}
