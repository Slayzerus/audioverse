import { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";

const PlayerForm = () => {
    const [playerName, setPlayerName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Player Added:", playerName);
    };

    return (
        <Container>
            <h2>Add Player</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Player Name</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter player name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                </Form.Group>
                <Button variant="success" type="submit">
                    Add Player
                </Button>
            </Form>
        </Container>
    );
};

export default PlayerForm;
