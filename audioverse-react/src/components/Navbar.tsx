import { Navbar, Nav, Container, NavItem } from "react-bootstrap";
import { Focusable } from "./common/Focusable";
import { useEffect, useCallback, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext.tsx";
import ThemePicker from "./common/ThemePicker";
import LanguageSwitcher from "./common/LanguageSwitcher";
import NotificationBell from "./common/NotificationBell";
import { useTutorial as useTutorialContext } from "../contexts/TutorialContext";
import "./navbarStyles.css";
import { FaQuestionCircle, FaQrcode } from "react-icons/fa";
import { FaRadio } from "react-icons/fa6";
import { useTheme } from "../contexts/ThemeContext";
import { useConfirm } from './ui/ConfirmProvider';
import { useToast } from './ui/ToastProvider';
import { useRadio } from '../contexts/RadioContext';
import { useNavbarDropdowns } from "../hooks/useNavbarDropdowns";
import NavDropdownMenu from "./navbar/NavDropdownMenu";
import { musicItems, gamesItems, createItems, socialItems, adminItems, profileItems, settingsItems } from "./navbar/navMenuItems";
import { useFeatureVisibility } from "../hooks/useFeatureVisibility";

const AppNavbar = () => {
    const { isAuthenticated, logout, isAdmin, requirePasswordChange, userId } = useUser();
    const {
        dropdownsOpen, setDropdownOpen, handleDropdownMouseEnter, handleDropdownMouseLeave,
        setActive, activeId, focusables,
    } = useNavbarDropdowns();
    const confirm = useConfirm();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { isFeatureVisible } = useFeatureVisibility();

    // Filter callback: hide navbar items whose featureId is not visible
    const filterItem = useCallback(
        (item: { id: string }) => isFeatureVisible(item.id),
        [isFeatureVisible],
    );

    const location = useLocation();
    // Set focus only after page change (pathname), not after every gamepad move
    useEffect(() => {
        // Don't steal focus when on game routes — games manage their own focus
        const isGameRoute = location.pathname.startsWith('/mini-games/') || location.pathname.startsWith('/honest-living/');
        if (isGameRoute) return;

        if (navigator.getGamepads) {
            const pads = Array.from(navigator.getGamepads()).filter(Boolean);
            if (pads.length > 0) {
                // Set focus on navbar-karaoke only if no navbar element or dropdown-item is active
                const navbarIds = [
                    "navbar-music", "navbar-games", "navbar-create", "navbar-social", "navbar-admin", "navbar-profile", "navbar-settings", "navbar-theme", "navbar-signout"
                ];
                const isNavbarOrDropdownItem =
                    activeId && (navbarIds.includes(activeId) || navbarIds.some(id => activeId.startsWith(id + "-item-")));
                if (
                    isAuthenticated &&
                    location.pathname !== "/login" &&
                    location.pathname !== "/register" &&
                    (!activeId || !isNavbarOrDropdownItem)
                ) {
                    setTimeout(() => setActive("navbar-music"), 200);
                } else if (!isAuthenticated && location.pathname === "/register") {
                    setTimeout(() => setActive("navbar-signup"), 200);
                }
                // NIE ustawiaj focusu na navbar-signin na stronie /login!
            }
        }
    }, [isAuthenticated, setActive, location.pathname, activeId, focusables]);
    // location is already declared above, no need to declare again
    const navigate = useNavigate();
    const { resetTutorials } = useTutorialContext();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleResetTutorials = async () => {
        try {
            const ok = await confirm(t('nav.resetTutorialsConfirm'));
            if (!ok) return;
            resetTutorials();
            showToast(t('nav.resetTutorialsSuccess'), 'success');
        } catch (_e) { /* Intentionally swallowed — non-critical operation */ }
    };

    const { theme, themeDef } = useTheme();
    const isDark = themeDef?.isDark ?? (theme === 'dark');

    // ── Classic FM radio toggle (state managed by RadioContext) ──
    const { radioPlaying, toggleRadio } = useRadio();

    const handleQuickKaraoke = () => {
        if (!userId) {
            showToast(t('nav.mustBeLoggedIn') || 'Please sign in', 'info');
            return;
        }
        navigate('/quick-karaoke');
    };

    // Data-driven menu items (memoized)
    const memoGamesItems = useMemo(() => gamesItems(handleQuickKaraoke), [handleQuickKaraoke]);
    const memoSettingsItems = useMemo(() => settingsItems(handleResetTutorials, <FaQuestionCircle style={{marginRight: 8}} />), [handleResetTutorials]);

    // Shared dropdown props factory
    const dropdownProps = useCallback((navId: string) => ({
        isOpen: !!dropdownsOpen[navId],
        onToggle: (open: boolean) => setDropdownOpen(navId, open),
        onMouseEnter: () => handleDropdownMouseEnter(navId),
        onMouseLeave: () => handleDropdownMouseLeave(navId),
    }), [dropdownsOpen, setDropdownOpen, handleDropdownMouseEnter, handleDropdownMouseLeave]);

    return (
        <Navbar
            role="navigation"
            aria-label={t('nav.mainNavigation', 'Main navigation')}
            style={{
                background: "var(--nav-bg)",
                color: "var(--nav-text)",
                minHeight: 60
            }}
            variant={isDark ? "dark" : "light"}
            expand="lg"
        >
            <Container>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Navbar.Brand as={Link} to="/">
                        <span
                            style={{
                                color: "var(--text-primary)",
                                textShadow: "0 0 0 2px var(--bg-primary), 0 0 1px var(--bg-primary)",
                                fontWeight: 700,
                                fontSize: 24,
                                letterSpacing: 1
                            }}
                        >
                            Audio
                        </span>
                        <span
                            style={{
                                color: "var(--nav-active)",
                                textShadow: "0 0 0 2px var(--bg-primary), 0 0 1px var(--bg-primary)",
                                fontWeight: 700,
                                fontSize: 24,
                                letterSpacing: 1
                            }}
                        >
                            Verse
                        </span>
                    </Navbar.Brand>
                    {(!requirePasswordChange && isAuthenticated) && (
                        <Nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isFeatureVisible("nav-music") && <NavDropdownMenu navId="navbar-music" titleKey="nav.music" bootstrapId="music-dropdown" items={musicItems} filterItem={filterItem} {...dropdownProps("navbar-music")} />}
                            {isFeatureVisible("nav-games") && <NavDropdownMenu navId="navbar-games" titleKey="nav.games" bootstrapId="games-dropdown" items={memoGamesItems} filterItem={filterItem} {...dropdownProps("navbar-games")} />}
                            {isFeatureVisible("nav-create") && <NavDropdownMenu navId="navbar-create" titleKey="nav.create" bootstrapId="create-dropdown" items={createItems} filterItem={filterItem} {...dropdownProps("navbar-create")} />}
                            {isFeatureVisible("nav-social") && <NavDropdownMenu navId="navbar-social" titleKey="nav.social" bootstrapId="social-dropdown" items={socialItems} filterItem={filterItem} {...dropdownProps("navbar-social")} />}
                        </Nav>
                    )}
                </div>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {/* Hide ALL navigation except Sign Out when requirePasswordChange is true */}
                    {(!requirePasswordChange && isAuthenticated) && (
                        <Nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {isAdmin && isFeatureVisible("nav-admin") && (
                                <NavDropdownMenu navId="navbar-admin" titleKey="nav.admin" bootstrapId="admin-dropdown" style={{ color: "goldenrod" }} items={adminItems} filterItem={filterItem} autoFocusFirstItem setActive={setActive} {...dropdownProps("navbar-admin")} />
                            )}
                            {isFeatureVisible("nav-profile") && <NavDropdownMenu navId="navbar-profile" titleKey="nav.profile" bootstrapId="profile-dropdown" style={{ color: "white" }} items={profileItems} filterItem={filterItem} {...dropdownProps("navbar-profile")} />}
                            {isFeatureVisible("nav-settings") && <NavDropdownMenu navId="navbar-settings" titleKey="nav.settingsTitle" bootstrapId="settings-dropdown" style={{ color: "white" }} align="end" items={memoSettingsItems} filterItem={filterItem} autoFocusFirstItem setActive={setActive} {...dropdownProps("navbar-settings")} />}
                            <Focusable id="navbar-signout">
                                <NavItem>
                                    <Nav.Link onClick={handleLogout} className="signout-link">{t('nav.signOut')}</Nav.Link>
                                </NavItem>
                            </Focusable>
                        </Nav>
                    )}
                    <Nav className="ms-auto" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isAuthenticated && (
                            <NavItem>
                                <Focusable id="navbar-radio">
                                    <Nav.Link
                                        onClick={toggleRadio}
                                        aria-label={radioPlaying ? t('nav.radioStop', 'Stop radio') : t('nav.radioPlay', 'Play Classic FM')}
                                        title={radioPlaying ? 'Classic FM ■ Stop' : 'Classic FM ▶'}
                                        className="d-flex align-items-center justify-content-center"
                                        style={{ minHeight: 40, padding: '4px 10px', cursor: 'pointer' }}
                                    >
                                        <FaRadio
                                            size={18}
                                            style={{
                                                color: radioPlaying ? 'var(--primary, #3b82f6)' : 'var(--text-muted, #6b7280)',
                                                filter: radioPlaying ? 'drop-shadow(0 0 4px var(--primary, #3b82f6))' : 'none',
                                                transition: 'color 0.2s, filter 0.2s',
                                            }}
                                        />
                                    </Nav.Link>
                                </Focusable>
                            </NavItem>
                        )}
                        {isAuthenticated && (
                            <NavItem>
                                <NotificationBell />
                            </NavItem>
                        )}
                        {isAuthenticated && !requirePasswordChange ? (
                            <NavItem>
                                <Focusable id="navbar-join-phone-right">
                                    <Nav.Link
                                        as={Link}
                                        to="/join"
                                        aria-label={t('nav.joinPhone')}
                                        title={t('nav.joinPhone')}
                                        className="d-flex align-items-center justify-content-center"
                                        style={{ color: "var(--nav-text)", minHeight: 40, padding: "4px 10px" }}
                                    >
                                        <FaQrcode size={18} />
                                    </Nav.Link>
                                </Focusable>
                            </NavItem>
                        ) : null}
                        {isAuthenticated ? (
                            requirePasswordChange ? (
                                <NavItem>
                                    <Focusable id="navbar-signout">
                                        <Nav.Link onClick={handleLogout} className="signout-link">{t('nav.signOut')}</Nav.Link>
                                    </Focusable>
                                </NavItem>
                            ) : null
                        ) : (
                            <>
                                <NavItem>
                                    <Focusable id="navbar-signin">
                                        <Nav.Link
                                            as={Link}
                                            to="/login"
                                            className={`signin-link${location.pathname === "/login" ? " active" : ""}`}
                                        >
                                            {t('nav.signIn')}
                                        </Nav.Link>
                                    </Focusable>
                                </NavItem>
                                <NavItem>
                                    <Focusable id="navbar-signup">
                                        <Nav.Link
                                            as={Link}
                                            to="/register"
                                            className={`signup-link${location.pathname === "/register" ? " active" : ""}`}
                                        >
                                            {t('nav.signUp')}
                                        </Nav.Link>
                                    </Focusable>
                                </NavItem>
                            </>
                        )}
                        <NavItem>
                            <ThemePicker />
                        </NavItem>
                        <NavItem>
                            <LanguageSwitcher />
                        </NavItem>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default AppNavbar;
