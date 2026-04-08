import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl'
import { useEffect, useRef } from 'react'
import './CircularGallery.css'

function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: ReturnType<typeof setTimeout>
  return function (this: any, ...args: any[]) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

function lerp(p1: number, p2: number, t: number) { return p1 + (p2 - p1) * t }

function createTextTexture(gl: any, text: string, font = 'bold 30px monospace', color = 'white') {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = font
  const metrics = ctx.measureText(text)
  canvas.width = Math.ceil(metrics.width) + 20
  canvas.height = Math.ceil(parseInt(font, 10) * 1.2) + 20
  ctx.font = font
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new Texture(gl, { generateMipmaps: false })
  texture.image = canvas
  return { texture, width: canvas.width, height: canvas.height }
}

class Title {
  mesh: any
  constructor({ gl, plane, text, textColor = '#ffffff', font = '30px sans-serif' }: any) {
    const { texture, width, height } = createTextTexture(gl, text, font, textColor)
    const geometry = new Plane(gl)
    const program = new Program(gl, {
      vertex: `attribute vec3 position;attribute vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
      fragment: `precision highp float;uniform sampler2D tMap;varying vec2 vUv;void main(){vec4 c=texture2D(tMap,vUv);if(c.a<0.1)discard;gl_FragColor=c;}`,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    })
    this.mesh = new Mesh(gl, { geometry, program })
    const aspect = width / height
    const textHeight = plane.scale.y * 0.15
    this.mesh.scale.set(textHeight * aspect, textHeight, 1)
    this.mesh.position.y = -plane.scale.y * 0.5 - textHeight * 0.5 - 0.05
    this.mesh.setParent(plane)
  }
}

class Media {
  extra = 0; speed = 0; isBefore = false; isAfter = false
  plane: any; program: any; width = 0; widthTotal = 0; x = 0; padding = 0; scale = 0
  opts: any
  constructor(opts: any) {
    this.opts = opts
    this.createShader()
    this.createMesh()
    new Title({ gl: opts.gl, plane: this.plane, text: opts.text, textColor: opts.textColor, font: opts.font })
    this.onResize()
  }
  createShader() {
    const texture = new Texture(this.opts.gl, { generateMipmaps: true })
    this.program = new Program(this.opts.gl, {
      depthTest: false, depthWrite: false,
      vertex: `precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;uniform float uTime;uniform float uSpeed;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z=(sin(p.x*4.0+uTime)*1.5+cos(p.y*2.0+uTime)*1.5)*(0.1+uSpeed*0.5);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
      fragment: `precision highp float;uniform vec2 uImageSizes;uniform vec2 uPlaneSizes;uniform sampler2D tMap;uniform float uBorderRadius;varying vec2 vUv;float roundedBoxSDF(vec2 p,vec2 b,float r){vec2 d=abs(p)-b;return length(max(d,vec2(0.0)))+min(max(d.x,d.y),0.0)-r;}void main(){vec2 ratio=vec2(min((uPlaneSizes.x/uPlaneSizes.y)/(uImageSizes.x/uImageSizes.y),1.0),min((uPlaneSizes.y/uPlaneSizes.x)/(uImageSizes.y/uImageSizes.x),1.0));vec2 uv=vec2(vUv.x*ratio.x+(1.0-ratio.x)*0.5,vUv.y*ratio.y+(1.0-ratio.y)*0.5);vec4 color=texture2D(tMap,uv);float d=roundedBoxSDF(vUv-0.5,vec2(0.5-uBorderRadius),uBorderRadius);float alpha=1.0-smoothstep(-0.002,0.002,d);gl_FragColor=vec4(color.rgb,alpha);}`,
      uniforms: { tMap: { value: texture }, uPlaneSizes: { value: [0, 0] }, uImageSizes: { value: [0, 0] }, uSpeed: { value: 0 }, uTime: { value: 100 * Math.random() }, uBorderRadius: { value: this.opts.borderRadius } },
      transparent: true,
    })
    const img = new Image(); img.crossOrigin = 'anonymous'; img.src = this.opts.image
    img.onload = () => { texture.image = img; this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight] }
  }
  createMesh() {
    this.plane = new Mesh(this.opts.gl, { geometry: this.opts.geometry, program: this.program })
    this.plane.setParent(this.opts.scene)
  }
  update(scroll: any, direction: string) {
    this.plane.position.x = this.x - scroll.current - this.extra
    const x = this.plane.position.x, H = this.opts.viewport.width / 2
    if (this.opts.bend === 0) { this.plane.position.y = 0; this.plane.rotation.z = 0 }
    else {
      const R = (H * H + Math.abs(this.opts.bend) ** 2) / (2 * Math.abs(this.opts.bend))
      const ex = Math.min(Math.abs(x), H)
      const arc = R - Math.sqrt(R * R - ex * ex)
      this.plane.position.y = this.opts.bend > 0 ? -arc : arc
      this.plane.rotation.z = (this.opts.bend > 0 ? -1 : 1) * Math.sign(x) * Math.asin(ex / R)
    }
    this.speed = scroll.current - scroll.last
    this.program.uniforms.uTime.value += 0.04
    this.program.uniforms.uSpeed.value = this.speed
    const po = this.plane.scale.x / 2, vo = this.opts.viewport.width / 2
    this.isBefore = this.plane.position.x + po < -vo
    this.isAfter = this.plane.position.x - po > vo
    if (direction === 'right' && this.isBefore) { this.extra -= this.widthTotal; this.isBefore = this.isAfter = false }
    if (direction === 'left' && this.isAfter) { this.extra += this.widthTotal; this.isBefore = this.isAfter = false }
  }
  onResize({ screen, viewport }: any = {}) {
    if (screen) this.opts.screen = screen
    if (viewport) this.opts.viewport = viewport
    this.scale = this.opts.screen.height / 1500
    this.plane.scale.y = (this.opts.viewport.height * (900 * this.scale)) / this.opts.screen.height
    this.plane.scale.x = (this.opts.viewport.width * (700 * this.scale)) / this.opts.screen.width
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y]
    this.padding = 2
    this.width = this.plane.scale.x + this.padding
    this.widthTotal = this.width * this.opts.length
    this.x = this.width * this.opts.index
  }
}

class App {
  scroll: any; medias: Media[] = []; mediasImages: any[] = []
  renderer: any; gl: any; camera: any; scene: any; planeGeometry: any
  screen: any; viewport: any; raf = 0
  boundOnResize: any; boundOnWheel: any; boundOnTouchDown: any; boundOnTouchMove: any; boundOnTouchUp: any
  isDown = false; start = 0
  onCheckDebounce: any
  container: HTMLElement; opts: any

  constructor(container: HTMLElement, opts: any) {
    this.container = container; this.opts = opts
    this.scroll = { ease: opts.scrollEase ?? 0.05, current: 0, target: 0, last: 0 }
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200)
    this.createRenderer(); this.createCamera(); this.createScene()
    this.onResize(); this.createGeometry()
    this.createMedias(); this.update(); this.addEventListeners()
  }
  createRenderer() {
    this.renderer = new Renderer({ alpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 2) })
    this.gl = this.renderer.gl; this.gl.clearColor(0, 0, 0, 0)
    this.container.appendChild(this.gl.canvas)
  }
  createCamera() { this.camera = new Camera(this.gl); this.camera.fov = 45; this.camera.position.z = 20 }
  createScene() { this.scene = new Transform() }
  createGeometry() { this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 }) }
  createMedias() {
    const { items, bend = 1, textColor = '#ffffff', borderRadius = 0, font = 'bold 30px sans-serif' } = this.opts
    this.mediasImages = [...items, ...items]
    this.medias = this.mediasImages.map((data, index) => new Media({
      geometry: this.planeGeometry, gl: this.gl, image: data.image, index,
      length: this.mediasImages.length, renderer: this.renderer, scene: this.scene,
      screen: this.screen, text: data.text, viewport: this.viewport,
      bend, textColor, borderRadius, font,
    }))
  }
  onTouchDown(e: any) { this.isDown = true; this.scroll.position = this.scroll.current; this.start = e.touches ? e.touches[0].clientX : e.clientX }
  onTouchMove(e: any) {
    if (!this.isDown) return
    const x = e.touches ? e.touches[0].clientX : e.clientX
    this.scroll.target = this.scroll.position + (this.start - x) * ((this.opts.scrollSpeed ?? 2) * 0.025)
  }
  onTouchUp() { this.isDown = false; this.onCheck() }
  onWheel(e: any) {
    const delta = e.deltaY || e.wheelDelta || e.detail
    this.scroll.target += (delta > 0 ? (this.opts.scrollSpeed ?? 2) : -(this.opts.scrollSpeed ?? 2)) * 0.2
    this.onCheckDebounce()
  }
  onCheck() {
    if (!this.medias[0]) return
    const w = this.medias[0].width
    const idx = Math.round(Math.abs(this.scroll.target) / w)
    this.scroll.target = this.scroll.target < 0 ? -(w * idx) : w * idx
  }
  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight }
    this.renderer.setSize(this.screen.width, this.screen.height)
    this.camera.perspective({ aspect: this.screen.width / this.screen.height })
    const fov = (this.camera.fov * Math.PI) / 180
    const h = 2 * Math.tan(fov / 2) * this.camera.position.z
    this.viewport = { width: h * this.camera.aspect, height: h }
    this.medias.forEach(m => m.onResize({ screen: this.screen, viewport: this.viewport }))
  }
  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease)
    const dir = this.scroll.current > this.scroll.last ? 'right' : 'left'
    this.medias.forEach(m => m.update(this.scroll, dir))
    this.renderer.render({ scene: this.scene, camera: this.camera })
    this.scroll.last = this.scroll.current
    this.raf = requestAnimationFrame(this.update.bind(this))
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this)
    this.boundOnWheel = this.onWheel.bind(this)
    this.boundOnTouchDown = this.onTouchDown.bind(this)
    this.boundOnTouchMove = this.onTouchMove.bind(this)
    this.boundOnTouchUp = this.onTouchUp.bind(this)
    window.addEventListener('resize', this.boundOnResize)
    window.addEventListener('wheel', this.boundOnWheel)
    window.addEventListener('mousedown', this.boundOnTouchDown)
    window.addEventListener('mousemove', this.boundOnTouchMove)
    window.addEventListener('mouseup', this.boundOnTouchUp)
    window.addEventListener('touchstart', this.boundOnTouchDown)
    window.addEventListener('touchmove', this.boundOnTouchMove)
    window.addEventListener('touchend', this.boundOnTouchUp)
  }
  destroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.boundOnResize)
    window.removeEventListener('wheel', this.boundOnWheel)
    window.removeEventListener('mousedown', this.boundOnTouchDown)
    window.removeEventListener('mousemove', this.boundOnTouchMove)
    window.removeEventListener('mouseup', this.boundOnTouchUp)
    window.removeEventListener('touchstart', this.boundOnTouchDown)
    window.removeEventListener('touchmove', this.boundOnTouchMove)
    window.removeEventListener('touchend', this.boundOnTouchUp)
    if (this.gl?.canvas?.parentNode) this.gl.canvas.parentNode.removeChild(this.gl.canvas)
  }
}

type Item = { image: string; text: string; id?: string }

type Props = {
  items: Item[]
  bend?: number
  textColor?: string
  borderRadius?: number
  font?: string
  scrollSpeed?: number
  scrollEase?: number
}

export default function CircularGallery({ items, bend = 3, textColor = '#ffffff', borderRadius = 0.05, font = 'bold 30px sans-serif', scrollSpeed = 2, scrollEase = 0.05 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!containerRef.current || !items.length) return
    const app = new App(containerRef.current, { items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase })
    return () => app.destroy()
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase])
  return <div className="circular-gallery" ref={containerRef} />
}
