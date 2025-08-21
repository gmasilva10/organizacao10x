"use client"

import dynamic from "next/dynamic"
import { useEffect, useRef, useState } from "react"
import type { GlobeMethods } from "react-globe.gl"

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
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
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

  useEffect(() => {
    if (!globeRef.current) return
    const controls = globeRef.current.controls?.()
    if (controls) {
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.3
    }
    globeRef.current.pointOfView({ altitude: 2.8 }, 0)
  }, [size])

  // Usa texturas remotas confiáveis por padrão (podem ser trocadas por arquivos locais depois)
  const textureUrl = "https://unpkg.com/three-globe/example/img/earth-day.jpg"
  const bumpUrl = "https://unpkg.com/three-globe/example/img/earth-topology.png"

	return (
		<div ref={containerRef} className={className} style={{ pointerEvents: "none" }}>
      <Globe
				ref={globeRef}
				width={size.w}
				height={size.h}
				backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={textureUrl}
        bumpImageUrl={bumpUrl}
				showAtmosphere={true}
				atmosphereAltitude={0.15}
				animateIn={true}
			/>
		</div>
	)
}
