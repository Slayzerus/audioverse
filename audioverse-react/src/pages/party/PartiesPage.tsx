import React, { useEffect, useState } from "react";
import { getAllParties } from "../../scripts/api/apiKaraoke.ts";
import { KaraokeParty } from "../../models/modelsKaraoke.ts";


const PartiesPage: React.FC = () => {
    const [parties, setParties] = useState<KaraokeParty[]>([]);

    useEffect(() => {
        getAllParties()
            .then(response => setParties(response))
            .catch(error => console.error("Error fetching parties", error));
    }, []);

    return (
        <div>
            <h1>Lista imprez karaoke</h1>

            <ul id="bij-bąki" style={{ display: "none" }}>
                <li><a href="http://173.212.245.15:3000" target="_blank"> Wiki</a></li>
                <li><a href="http://173.212.245.15:8080" target="_blank">🗃️ Adminer (PostgreSQL GUI)</a></li>
                <li><a href="http://173.212.245.15:5601" target="_blank">📊 Kibana</a></li>
                <li><a href="http://173.212.245.15:8001" target="_blank">📡 Kong API Gateway Admin</a></li>
                <li><a href="http://173.212.245.15:8000" target="_blank">📡 Kong API Gateway Proxy</a></li>
                <li><a href="http://173.212.245.15:8089" target="_blank">🔥 Locust UI (Testy wydajnościowe)</a></li>
                <li><a href="http://173.212.245.15:8081" target="_blank">🔗 Kafka UI</a></li>
                <li><a href="http://173.212.245.15:9001" target="_blank">📮 MinIO UI (Przechowywanie plików)</a></li>
                <li>Nie działają:</li>
                <li><a href="http://173.212.245.15:5000/swagger" target="_blank">🚀 API (Swagger?)</a></li>
                <li><a href="http://173.212.245.15:5001" target="_blank">🛂 Identity Server UI</a></li>
                <li><a href="http://173.212.245.15:3000" target="_blank">🎭 Playwright UI</a></li>
            </ul>
        </div>
    );
};

export default PartiesPage;
