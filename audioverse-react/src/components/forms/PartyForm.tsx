import { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import { createParty } from "../../scripts/api/apiKaraoke.ts"; // Import funkcji API

const PartyForm = () => {
    const [partyName, setPartyName] = useState("");
    const [description, setDescription] = useState("");
    const [organizerId, setOrganizerId] = useState<number | undefined>(undefined);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!partyName || !description || !organizerId) {
            alert("All fields are required!");
            return;
        }

        try {
            await createParty({
                name: partyName,
                description: description,
                organizerId: organizerId
            });
            alert("Party created successfully!");
        } catch (error) {
            console.error("Error creating party:", error);
        }
    };

    return (
        <Container>
            <h2>Create Party</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Party Name</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter party name"
                        value={partyName}
                        onChange={(e) => setPartyName(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Organizer ID</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Enter organizer ID"
                        value={organizerId || ""}
                        onChange={(e) => setOrganizerId(Number(e.target.value))}
                    />
                </Form.Group>
                <Button variant="primary" type="submit">
                    Create
                </Button>
            </Form>
        </Container>
    );
};

export default PartyForm;
