import './App.css'
import { RecordManager } from './components/RecordManager/RecordManager';
import { PokemonSpecies } from './components/Pokemon/PokemonSpecies';

function App() {
  return (
    <>
      <h1>Pokemon species::</h1>
      <PokemonSpecies />

      <RecordManager />
    </>
  )
}

export default App
