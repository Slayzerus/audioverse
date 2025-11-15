import { Navbar, Nav, Container, NavDropdown, NavItem } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "./UserContext.tsx";

const AppNavbar = () => {
    const { isAuthenticated, logout } = useUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <Navbar bg="black" variant="black" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">
                    <span style={{ color: "white" }}>Audio</span>
                    <span style={{ color: "goldenrod" }}>Verse</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {isAuthenticated && (
                        <Nav className="me-auto">
                            <NavDropdown title="Play" id="play-dropdown" className="nav-drop" style={{ color: "white" }}>
                                <NavDropdown.Item as={Link} to="/play">Play</NavDropdown.Item>
                            </NavDropdown>

                            <NavDropdown title="Sing" id="party-dropdown" className="nav-drop" style={{ color: "white" }}>
                                <NavDropdown.Item as={Link} to="/rounds">Karaoke</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/parties">Parties</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/players">Players</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/songs">Songs</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/playlists">Playlists</NavDropdown.Item>
                            </NavDropdown>

                            <NavDropdown title="Create" id="create-dropdown" className="nav-drop" style={{ color: "white" }}>
                                <NavDropdown.Item as={Link} to="/create/studio">Music Editor</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/dmxEditor">DMX Editor</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/create">Create</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/create/projects">Projects</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/characters">Judges</NavDropdown.Item>
                            </NavDropdown>

                            <NavDropdown title="Explore" id="explore-dropdown" className="nav-drop" style={{ color: "white" }}>
                                <NavDropdown.Item as={Link} to="/explore">Explore</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/library">Library</NavDropdown.Item>
                            </NavDropdown>

                            <NavDropdown title="Enjoy" id="enjoy-dropdown" className="nav-drop" style={{ color: "white" }}>
                                <NavDropdown.Item as={Link} to="/musicPlayer">Music Player</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/enjoy">Enjoy</NavDropdown.Item>
                            </NavDropdown>

                            <NavDropdown title="Settings" id="settings-dropdown" className="nav-drop" style={{ color: "white" }}>
                                <NavDropdown.Item as={Link} to="/settings/audioInput">Audio Input</NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/settings/controller">Controllers</NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                    )}

                    <Nav className="ms-auto">
                        {isAuthenticated ? (
                            <>
                                <NavDropdown title="Profile" id="profile-dropdown" className="nav-drop" style={{ color: "white" }}>
                                    <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                                </NavDropdown>
                                <NavItem>
                                    <Nav.Link onClick={handleLogout} className="signout-link">Sign Out</Nav.Link>
                                </NavItem>
                            </>
                        ) : (
                            <NavItem>
                                <Nav.Link as={Link} to="/login" className="signin-link">Sign In</Nav.Link>
                            </NavItem>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavbar;
