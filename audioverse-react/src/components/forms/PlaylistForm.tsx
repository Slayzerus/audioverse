import { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";

const PlaylistForm = () => {
    const [playlistName, setPlaylistName] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Playlist Created:", playlistName);
    };

    return (
        <Container>
            <h2>Create Playlist</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Playlist Name</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter playlist name"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                    />
                </Form.Group>
                <Button variant="warning" type="submit">
                    Create Playlist
                </Button>
            </Form>
        </Container>
    );
};

export default PlaylistForm;
