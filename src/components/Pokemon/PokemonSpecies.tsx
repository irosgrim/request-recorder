import { useEffect, useState } from "react";
import "./PokemonsSpecies.css";

const POKE_BASE = "https://pokeapi.co/api/v2/";
type PokeDetails = {
    name: string;
    base_happiness: number;
    capture_rate: number;
    growth_rate: {
        name: string;
        url: string;
    };
    varieties: {
        pokemon: {
            name: string;
            url: string;
        }
    }[];
    picture: string | null
};

export const PokemonSpecies = () => {
    const [pokemonSpecies, setPokemonSpecies] = useState<{ name: string; url: string }[]>([]);
    const [showDetails, setShowDetails] = useState<PokeDetails | null>(null);

    const getImage = async (url: string) => {
        const f = await fetch(url)
        const data = await f.json();
        if (data.sprites) {
            const sprite = data.sprites.front_default ?? (Object.values(data.sprites)[0] ?? null);
            return sprite;
        }
        return null;
    }

    const handleShowDetails = (url: string) => {
        fetch(url).then(r => r.json()).then(async (data) => {
            if (data.varieties.length > 0) {
                const image = await getImage(data.varieties[0].pokemon.url);
                data.picture = image;
            }
            setShowDetails(data)
        }).catch(() => setShowDetails(null));
    };

    useEffect(() => {
        fetch(POKE_BASE + "pokemon-species").then(r => r.json()).then(data => setPokemonSpecies(data.results ?? []));
    }, []);



    return (
        <div className="poke-frame">
            <ul className="poke-list">
                {
                    pokemonSpecies.map(p => (
                        <li key={p.name}>
                            <button onClick={() => handleShowDetails(p.url)}>{p.name}</button>
                        </li>
                    ))
                }
            </ul>
            {
                showDetails && (
                    <div className="poke-details">
                        <p>Name: {showDetails.name}</p>
                        <p>Happiness: {showDetails.base_happiness}</p>
                        <p>Capture rate: {showDetails.capture_rate}</p>
                        <p>Growth rate: {showDetails.growth_rate.name}</p>
                        {
                            showDetails.picture && <img src={showDetails.picture} alt={showDetails.name} />
                        }

                    </div>
                )
            }
        </div>
    );
}