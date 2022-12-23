import './App.css';
import { Canvas } from '@react-three/fiber';

function App() {
  return (
    <div className="App">
      <Canvas>
        <ambientLight intensity={0.1} />
        <directionalLight color="black" position={[0, 0, 5]} />
        <mesh>
          <octahedronGeometry />
          <meshStandardMaterial />
        </mesh>
      </Canvas>
    </div>
  );
}

export default App;
