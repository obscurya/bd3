import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Sky } from 'three/examples/jsm/objects/Sky'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'

import './style.css'

THREE.Cache.enabled = true

const getHours = () => {
  const date = new Date()
  const hours = date.getHours()
  const minutes = date.getMinutes()

  return hours + minutes / 60
}

const getSunAngle = (hours = getHours()) => {
  const MAX_HOUR = 12
  const MAX_ANGLE = 90

  return (1 - hours / MAX_HOUR) * MAX_ANGLE
}

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
const controls = new OrbitControls(camera, renderer.domElement)

document.body.appendChild(renderer.domElement)

scene.fog = new THREE.Fog(0xffffff, 0)

camera.position.set(0, 2, 6)

renderer.outputEncoding = THREE.sRGBEncoding

// renderer.toneMapping = THREE.ReinhardToneMapping
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.5

renderer.shadowMap.enabled = true
renderer.shadowMap.autoUpdate = true
renderer.shadowMap.needsUpdate = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

controls.autoRotate = true
controls.autoRotateSpeed = 0.3

window.onresize = () => {
  const width = window.innerWidth
  const height = window.innerHeight

  camera.aspect = width / height

  camera.updateProjectionMatrix()
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)
}

window.onresize()

const createFloor = () => {
  const geometry = new THREE.PlaneGeometry(1000, 1000)
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.BackSide
  })
  const plane = new THREE.Mesh(geometry, material)

  plane.receiveShadow = true

  plane.rotateX(Math.PI / 2)

  scene.add(plane)

  // const gridHelper = new THREE.GridHelper(200, 50)

  // scene.add(gridHelper)
}

const createSky = () => {
  const sky = new Sky()

  sky.scale.setScalar(1_000)

  scene.add(sky)

  const phi = THREE.MathUtils.degToRad(getSunAngle())
  const theta = THREE.MathUtils.degToRad(10)
  const sun = new THREE.Vector3()

  sun.setFromSphericalCoords(1, phi, theta)

  const config = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    sunPosition: sun
  }

  Object.entries(config).forEach(([key, value]) => {
    sky.material.uniforms[key].value = value
  })

  const vector = new THREE.Vector3().copy(sun).multiplyScalar(10)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)

  directionalLight.position.set(vector.x, vector.y, vector.z)

  directionalLight.castShadow = true
  directionalLight.shadow.bias = 0.001
  // directionalLight.shadow.radius = 1
  directionalLight.shadow.mapSize.width = 2 ** 12
  directionalLight.shadow.mapSize.height = 2 ** 12
  directionalLight.shadow.camera.left = -10
  directionalLight.shadow.camera.right = 10
  directionalLight.shadow.camera.top = 10
  directionalLight.shadow.camera.bottom = -10

  scene.add(directionalLight)

  // const lightHelper = new THREE.CameraHelper(directionalLight.shadow.camera)

  // scene.add(lightHelper)

  const light = new THREE.HemisphereLight(0x9575cd, 0x263238)

  light.position.set(vector.x, vector.y, vector.z)

  scene.add(light)
}

createFloor()
createSky()

const fontLoader = new FontLoader()

fontLoader.load('./fonts/Pacifico.json', font => {
  const geometry = new TextGeometry('Папа, с Днем рождения!', {
    font,
    size: 1,
    height: 0.1,
    curveSegments: 12
  })
  const material = new THREE.MeshPhongMaterial({
    color: 0x2196f3
  })
  const mesh = new THREE.Mesh(geometry, material)

  mesh.position.set(-5, 1, 0)
  mesh.rotateY(-Math.PI / 10)

  mesh.castShadow = true

  scene.add(mesh)
})

const gltfLoader = new GLTFLoader()

let cake = null

gltfLoader.load(
  './cake/scene.gltf',
  gltf => {
    cake = gltf.scene

    cake.position.set(-2, 4.47, -2)

    cake.traverse(node => {
      if (!node.isMesh) {
        return
      }

      node.castShadow = true
      // node.receiveShadow = true
    })

    // controls.target.set(cake.position.x, cake.position.y, cake.position.z)

    scene.add(cake)
  },
  undefined,
  error => {
    console.error(error)
  }
)

const render = () => {
  if (cake) {
    cake.rotation.y += 0.005
  }

  controls.update()
  renderer.render(scene, camera)

  requestAnimationFrame(render)
}

render()
