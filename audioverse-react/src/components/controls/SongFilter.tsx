import { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";

const SongFilter = () => {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Filtering Songs:", { title, artist });
    };

    return (
        <Container>
            <h2>Filter Songs</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Artist</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter artist"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                    />
                </Form.Group>
                <Button variant="info" type="submit">
                    Search
                </Button>
            </Form>
        </Container>
    );
};

export default SongFilter;
